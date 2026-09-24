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

## Próximos passos

1. Confira se o BitLocker ainda está suspenso. Se já tiver reiniciado, suspenda de novo:
   ```powershell
   manage-bde -status
   Suspend-BitLocker -MountPoint C: -RebootCount 2
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

Depois reative o Secure Boot na BIOS. O BitLocker volta a proteger sozinho quando acaba a contagem de reinicializações; para voltar na hora, rode `Resume-BitLocker -MountPoint C:`.

## Alternativa sem driver

O projeto tem `@serialport/binding-mock` nas devDependencies. Ele serve para testar o simulador sozinho, sem porta real. Não serve quando outro processo precisa abrir o outro lado da porta.
