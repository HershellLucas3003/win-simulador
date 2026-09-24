# Passo a passo: portas COM virtuais (com0com) para o simulador WIM

Este guia prepara o Windows 11 para rodar o `wim-equipment-simulator` com um par de portas seriais virtuais:

```
WIM-Service / Main.java  <-->  COM10  <==com0com==>  COM11  <-->  simulador
```

O driver do com0com não é aceito pelo Windows com o Secure Boot ligado. Por isso é preciso desligar o Secure Boot e ligar o modo de teste de drivers (`testsigning`). Como o BitLocker depende do Secure Boot, ele precisa ser tratado **antes**.

Tempo estimado: 20 a 30 minutos, mais o tempo de criptografia se optar por desativar o BitLocker por completo.

## Antes de começar

- Todos os comandos rodam no **PowerShell como administrador**: tecla Windows, digite `PowerShell`, clique com o botão direito e escolha **Executar como administrador**. O título da janela precisa começar com **Administrador:**. Sem isso os comandos dão "Acesso negado" ou não fazem nada, sem mostrar erro.
- No PowerShell, executáveis da pasta atual precisam de `.\` antes do nome: `.\setupc.exe`, não `setupc.exe`.
- Anote a chave de recuperação do BitLocker **em papel ou no celular**. Não cole essa chave em chat, e-mail, Jira ou arquivo do repositório.
- Se a BIOS tiver senha da empresa ou a opção "Executar como administrador" pedir uma senha que você não tem, fale com a TI antes.

## 1. Instalar o com0com

1. Baixe o com0com em https://sourceforge.net/projects/com0com/ e instale.
2. A pasta de instalação é `C:\Program Files (x86)\com0com`.

Nesta etapa as portas ainda não vão funcionar. Isso é esperado.

## 2. Desativar o BitLocker

Verifique o estado:

```powershell
manage-bde -status C:
manage-bde -protectors -get C:
```

- Se aparecer `Proteção Desativada` e nenhum protetor TPM, pule para a etapa 3.
- Se aparecer `Proteção Ativada`, anote a **Senha Numérica** (48 dígitos) fora do PC e escolha uma das opções abaixo.

### Opção A: suspender (recomendado)

Rápido, e o disco continua criptografado. O Windows não pede a chave nas próximas reinicializações:

```powershell
Suspend-BitLocker -MountPoint C: -RebootCount 3
```

Confira se aparece `Proteção Desativada (3 reinicializações restantes)`:

```powershell
manage-bde -status C:
```

### Opção B: desativar por completo

Descriptografa o disco inteiro. Pode levar horas, e o disco fica sem proteção até a etapa 7.

```powershell
Disable-BitLocker -MountPoint C:
```

Espere até `Totalmente Descriptografado` / `0,0%`. Acompanhe com:

```powershell
manage-bde -status C:
```

**Não entre na BIOS antes de terminar.**

## 3. Desligar o Secure Boot

1. Abra Configurações > Sistema > Recuperação > Inicialização avançada > **Reiniciar agora**.
2. Escolha Solucionar problemas > Opções avançadas > **Configurações de Firmware UEFI** > Reiniciar.
3. Na BIOS, procure em Security ou Boot a opção **Secure Boot** e mude para **Disabled**.
   - Se a opção estiver cinza, defina antes uma senha de supervisor (Supervisor/Admin Password) na BIOS.
4. Salve e saia (geralmente F10).

## 4. Ligar o modo de teste de drivers

Com o Windows iniciado, no PowerShell como administrador:

```powershell
bcdedit /set testsigning on
```

A resposta tem que ser `A operação foi concluída com êxito.`

Se aparecer "protegido pela política de Inicialização Segura", o Secure Boot ainda está ligado; volte à etapa 3.

Reinicie. Deve aparecer **Modo de Teste** no canto inferior direito da tela.

## 5. Criar o par de portas

```powershell
cd "C:\Program Files (x86)\com0com"
.\setupc.exe list
```

Se a lista vier vazia, crie o par:

```powershell
.\setupc.exe install PortName=COM10,EmuBR=yes PortName=COM11,EmuBR=yes
.\setupc.exe list
```

O resultado deve ser **um único par**:

```
       CNCA0 PortName=COM10,EmuBR=yes
       CNCB0 PortName=COM11,EmuBR=yes
```

O número depois de `CNCA`/`CNCB` pode ser diferente. `EmuBR=yes` emula a velocidade real da serial.

Se aparecer mais de um par, ou pares com `PortName=-` ou `PortName=COM#`, remova os extras pelo número (`CNCA3` é o par 3):

```powershell
.\setupc.exe remove 3
```

Se aparecer "The port name COM10 is already logged as in use", já existe outro par com esse nome. Rode `.\setupc.exe list` e remova o duplicado.

## 6. Validar as portas

```powershell
Get-PnpDevice | Where-Object { $_.InstanceId -match 'COM0COM|CNC' } | Select-Object Status, FriendlyName, InstanceId
[System.IO.Ports.SerialPort]::GetPortNames()
```

Resultado esperado:

- Todos os dispositivos com status `OK`.
- `COM10` e `COM11` listadas.

Problemas comuns:

| Sintoma | Solução |
|---|---|
| Status `Error` | O driver foi bloqueado. Confira as etapas 3 e 4 (Secure Boot desligado e "Modo de Teste" na tela). Se já estiver tudo certo, rode `.\uninstall.exe`, instale o com0com de novo e refaça a etapa 5. |
| Uma das portas sumiu depois de remover um par duplicado | Reinicie a porta com os comandos abaixo (troque `CNCB0` pelo nome que aparece no `list`). |

```powershell
Get-PnpDevice -InstanceId 'COM0COM\PORT\CNCB0' | Disable-PnpDevice -Confirm:$false
Get-PnpDevice -InstanceId 'COM0COM\PORT\CNCB0' | Enable-PnpDevice -Confirm:$false
```

## 7. Religar o BitLocker

O Secure Boot **continua desligado** enquanto você usar o com0com. O BitLocker funciona normalmente assim: o TPM passa a validar pelo perfil `0, 2, 4, 11` em vez do `7, 11`.

### Se usou a opção A (suspender)

```powershell
Resume-BitLocker -MountPoint C:
```

### Se usou a opção B (desativar)

```powershell
Enable-BitLocker -MountPoint C: -TpmProtector -UsedSpaceOnly
Add-BitLockerKeyProtector -MountPoint C: -RecoveryPasswordProtector
```

Anote a nova senha numérica fora do PC.

Se aparecer `Apenas um protetor de chave desse tipo é permitido (0x80310031)`, o TPM ainda está cadastrado. Nesse caso rode `manage-bde -on C:` e depois `Resume-BitLocker -MountPoint C:`.

### Nos dois casos

1. Acompanhe até `Totalmente Criptografado` e `Proteção Ativada`:
   ```powershell
   manage-bde -status C:
   ```
   Se terminar a criptografia e ainda mostrar `Proteção Desativada`, rode `Resume-BitLocker -MountPoint C:` de novo.
2. Deixe **uma** senha numérica só. Liste os protetores:
   ```powershell
   manage-bde -protectors -get C:
   ```
   Para apagar uma senha extra, use o ID real que aparece na lista, com as chaves:
   ```powershell
   manage-bde -protectors -delete C: -id "{0623743D-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
   ```
3. Faça backup da chave: Painel de Controle > Criptografia de Unidade de Disco BitLocker > **Fazer backup da chave de recuperação**. Se a máquina estiver no Azure AD da empresa, use:
   ```powershell
   BackupToAAD-BitLockerKeyProtector -MountPoint C: -KeyProtectorId "{ID}"
   ```
4. Reinicie uma vez. O Windows deve subir sem pedir a chave, e as portas devem continuar lá:
   ```powershell
   [System.IO.Ports.SerialPort]::GetPortNames()
   ```

## 8. Rodar o simulador

Na pasta do projeto:

```bash
cd wim-equipment-simulator
npm install
```

Em um terminal, suba o FTP de teste (câmera):

```bash
npm run ftp:local
```

Em outro terminal, suba o servidor e a interface:

```bash
npm run dev
```

Abra http://localhost:5180 e configure:

1. Na aba **Câmera**, preencha host `127.0.0.1`, porta `2121`, usuário `tracevia`, senha `teste`. Marque "Enviar imagens" e salve.
2. Na barra superior, escolha **COM11** e clique em **Abrir porta**.
3. Em **Eventos**, clique em **Passar agora**.

O WIM-Service (ou o `Main.java`) deve abrir a **COM10**. Veja o `README.md` do simulador para o teste de ponta a ponta.

Não aponte o simulador para o FTP do cliente (`10.22.100.12`).

## Como desfazer tudo

Siga esta ordem:

1. Suspenda o BitLocker (obrigatório antes de mexer em BIOS ou `bcdedit`):
   ```powershell
   Suspend-BitLocker -MountPoint C: -RebootCount 2
   ```
2. Desligue o modo de teste:
   ```powershell
   bcdedit /set testsigning off
   ```
3. Reinicie, entre na BIOS e deixe **Secure Boot = Enabled**.
4. Depois do boot, confira `manage-bde -status C:`. A proteção volta sozinha ao fim da contagem de reinicializações; para voltar na hora, rode `Resume-BitLocker -MountPoint C:`.

Com o Secure Boot religado, o com0com para de funcionar até você refazer as etapas 2 a 4.
