# Portas seriais virtuais (com0com) para o simulador WIM

O simulador usa o pacote `serialport`. Para que outro sistema (por exemplo o backend Java) converse com ele sem cabo físico, usamos o **com0com**, que cria um par de portas COM virtuais ligadas entre si:

```
simulador  <-->  COM10  <==com0com==>  COM11  <-->  sistema que lê o WIM
```

Instalação: `C:\Program Files (x86)\com0com` (com0com 3.0, driver **não assinado**).

## Status em 2026-09-24

| Item | Estado |
|---|---|
| com0com instalado | Sim |
| Par configurado | `CNCA2 PortName=COM10,EmuBR=yes` / `CNCB2 PortName=COM11,EmuBR=yes` |
| Pares extras (0, 1, 3) | Removidos |
| Barramento `ROOT\COM0COM\0002` | `Error`: driver bloqueado pelo Windows |
| `GetPortNames()` | Vazio |
| BitLocker em C: | Ativo (TPM com PCR 7, 11). Suspenso com `-RebootCount 2` |
| `bcdedit /set testsigning on` | Falhou: "protegido pela política de Inicialização Segura" |
| Secure Boot | **Ainda ligado**. Próximo passo: desligar na BIOS |

## Regras importantes

- Rode tudo no **PowerShell como administrador** (título da janela começa com "Administrador:"). Sem admin, o `setupc.exe` não faz nada e não mostra erro.
- No PowerShell, os executáveis da pasta atual precisam de `.\` antes do nome: `.\setupc.exe`.
- Antes de mexer no Secure Boot, suspenda o BitLocker; se não, o Windows pede a chave de recuperação ao iniciar.
  - A chave de recuperação tem backup na conta Microsoft: https://account.microsoft.com/devices/recoverykey
- A ordem é obrigatória: **desligar o Secure Boot na BIOS e só depois rodar o `bcdedit /set testsigning on`**.

## BitLocker

Se o TPM usa o PCR 7 (validação do Secure Boot), qualquer mudança no Secure Boot faz o Windows pedir a chave de recuperação no próximo boot. Resolva o BitLocker **antes** de entrar na BIOS.

### 1. Verificar o estado

```powershell
manage-bde -status C:
manage-bde -protectors -get C:
```

- `Status de Proteção: Proteção Desativada`: nada a fazer, siga para o Secure Boot.
- `Status de Proteção: Proteção Ativada`: escolha a opção A ou a B abaixo.
- Anote a **Senha Numérica** (48 dígitos) em um lugar fora do PC antes de continuar. Não coloque essa chave em arquivo do repositório nem em chat. Com conta Microsoft, ela também fica em https://account.microsoft.com/devices/recoverykey. Com máquina da empresa, pode estar no Azure AD/Intune; confirme com a TI.

### Opção A: suspender (recomendado)

O disco continua criptografado, mas o Windows não pede a chave durante N reinicializações. Depois disso a proteção volta sozinha, já com o novo estado do Secure Boot.

```powershell
Suspend-BitLocker -MountPoint C: -RebootCount 3
```

`-RebootCount 0` deixa suspenso até você reativar manualmente com `Resume-BitLocker -MountPoint C:`.

### Opção B: desativar por completo

Descriptografa o disco inteiro. Demora (de minutos a horas, conforme o tamanho do disco) e deixa o disco sem proteção. Use só se a opção A não funcionar e se a política da empresa permitir.

```powershell
Disable-BitLocker -MountPoint C:
```

Equivalente: `manage-bde -off C:`.

Acompanhe o progresso até chegar em `Totalmente Descriptografado` / `Porcentagem Criptografada: 0,0%`:

```powershell
manage-bde -status C:
```

Não mexa na BIOS enquanto a descriptografia estiver em andamento.

Pela interface: Painel de Controle > Sistema e Segurança > Criptografia de Unidade de Disco BitLocker > Desativar o BitLocker. No Windows 11 Home o caminho é Configurações > Privacidade e segurança > Criptografia do dispositivo > Desativado.

### Reativar depois

```powershell
Enable-BitLocker -MountPoint C: -TpmProtector -UsedSpaceOnly
Add-BitLockerKeyProtector -MountPoint C: -RecoveryPasswordProtector
```

Guarde a nova senha numérica que o segundo comando mostrar.

## Próximos passos

1. Resolva o BitLocker como descrito na seção [BitLocker](#bitlocker). Se já tiver reiniciado depois de suspender, suspenda de novo:
   ```powershell
   manage-bde -status
   Suspend-BitLocker -MountPoint C: -RebootCount 3
   ```
2. Entre na BIOS: Configurações > Sistema > Recuperação > Inicialização avançada > Reiniciar agora > Solucionar problemas > Opções avançadas > Configurações de Firmware UEFI.
3. Na BIOS, defina **Secure Boot = Disabled** e salve (F10).
   - Se a opção estiver cinza, defina antes uma senha de supervisor na BIOS.
   - Se a BIOS tiver senha da empresa, peça à TI.
4. No Windows, com o PowerShell de administrador:
   ```powershell
   bcdedit /set testsigning on
   ```
5. Reinicie. Deve aparecer "Modo de Teste" no canto da tela.
6. Valide:
   ```powershell
   cd "C:\Program Files (x86)\com0com"
   .\setupc.exe list
   Get-PnpDevice | Where-Object { $_.InstanceId -match 'COM0COM|CNC' } | Select-Object Status, FriendlyName, InstanceId
   [System.IO.Ports.SerialPort]::GetPortNames()
   ```
   Resultado esperado: status `OK` e as portas `COM10` e `COM11` listadas.
7. Se o status continuar `Error`, reinstale o com0com e recrie o par:
   ```powershell
   .\uninstall.exe
   ```
   Rode o instalador de novo e depois:
   ```powershell
   .\setupc.exe install PortName=COM10 PortName=COM11 EmuBR=yes
   ```
8. Configure o simulador em uma porta (ex.: COM10) e o sistema consumidor na outra (COM11).

## Comandos úteis do setupc

| Comando | Efeito |
|---|---|
| `.\setupc.exe list` | Lista os pares |
| `.\setupc.exe install PortName=COM10 PortName=COM11 EmuBR=yes` | Cria um par |
| `.\setupc.exe remove N` | Remove o par N (o número vem de `CNCAN`/`CNCBN`) |
| `.\setupc.exe change CNCA2 PortName=COM12` | Renomeia uma porta |

## Como desfazer

```powershell
bcdedit /set testsigning off
```

Depois reative o Secure Boot na BIOS. Antes disso, suspenda o BitLocker de novo (`Suspend-BitLocker -MountPoint C: -RebootCount 2`), porque a mudança no Secure Boot também dispara o pedido da chave. Se o BitLocker foi desativado por completo, reative seguindo [Reativar depois](#reativar-depois).

## Alternativa sem driver

O projeto tem `@serialport/binding-mock` nas devDependencies. Ele serve para testar o simulador sozinho, sem porta real. Não serve quando outro processo precisa abrir o outro lado da porta.
