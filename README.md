# Simulador do equipamento WIM

Simula o **controlador WIM na porta serial** e a **câmera no FTP**, para desenvolver e testar o `WIM-Service` sem o equipamento do cliente.

```
[WIM-Service] --COM10--  par com0com  --COM11-- [simulador] --FTP--> WIM/WIM_01/<dia>/  <-- FtpImageResolver do WIM-Service
```

O protocolo, o layout do frame e os tempos seguem o `WIM-Service/README.md` e as capturas reais em `WIM-Service/logs`. O encoder reproduz byte a byte os 3 frames reais do log do site 1 (`npm test`), e o `Main.java` real decodifica os frames gerados com os mesmos valores (`npm run contract:java`).

## Requisitos

- Node 22+ e npm 10+
- [com0com](https://sourceforge.net/projects/com0com/) (driver assinado 3.0.0.0 x64) para o par de portas virtuais
- Java 21 e as dependências do `WIM-Service` no `~/.m2`, apenas para `contract:java` e para o teste de ponta a ponta

## Instalação

```bash
npm install
```

### Par de portas COM (com0com)

Instale o com0com como administrador e, no "Setup Command Prompt" dele, crie o par com nomes `COMx`, porque o jSerialComm não enxerga os nomes padrão `CNCA0`/`CNCB0`:

```
setupc install PortName=COM10,EmuBR=yes PortName=COM11,EmuBR=yes
setupc list
```

`EmuBR=yes` emula a taxa de 115200 baud, deixando o tempo de transmissão parecido com o real.

## Rodando

```bash
npm run ftp:local   # FTP de teste em ftp://tracevia:teste@127.0.0.1:2121, arquivos em .ftp-root
npm run dev         # servidor em :4580 e interface em http://localhost:5180
```

Para uso sem hot reload: `npm run build` e depois `npm start`. A interface passa a ser servida em `http://127.0.0.1:4580`.

Na interface:

1. **Câmera**: host `127.0.0.1`, porta `2121`, usuário `tracevia`, senha `teste`. Marque "Enviar imagens" e salve.
2. Na barra superior, escolha `COM11` e clique em **Abrir porta**.
3. Em **Eventos**, use **Passar agora**, **Agendar**, **Rajada** ou **Emitir automático**.

Não aponte o simulador para o FTP do cliente (`10.22.100.12`).

## Teste de ponta a ponta com o Main.java

Com o simulador aberto em `COM11` e o FTP local rodando:

```bash
npm run contract:java
java -cp ".cache/java;%USERPROFILE%/.m2/repository/com/google/code/gson/gson/2.11.0/gson-2.11.0.jar;%USERPROFILE%/.m2/repository/com/fazecast/jSerialComm/2.11.0/jSerialComm-2.11.0.jar;%USERPROFILE%/.m2/repository/commons-net/commons-net/3.11.1/commons-net-3.11.1.jar" br.com.tracevia.wimservice.Main 1 COM10 127.0.0.1 tracevia teste 2121
```

O primeiro comando compila o `Main.java` em `.cache/java` sem tocar no `WIM-Service`. O JSON que o `Main.java` loga deve bater com o veículo mostrado na fila do simulador, e o `image_path` deve apontar para a imagem que o simulador subiu.

## O que dá para simular

**Resposta ao poll** (aba Equipamento). Cada comportamento é uma classe em `src/server/behaviors`:

| Comportamento | O que faz |
|---|---|
| Equipamento real | `FF 06` + 238 bytes em dois pedaços, parando em 240 (padrão, igual ao cliente) |
| Frame completo | 330 bytes de uma vez |
| Frame picado | pedaços de N bytes com atraso entre eles |
| Equipamento mudo | não responde ao poll |
| Cabeçalho inválido | troca o `0x06` por outro byte |
| Lixo na linha | bytes aleatórios antes da resposta |
| Frame desalinhado | perde bytes após o cabeçalho e gera valores como os do `wim_vbv` corrompido |
| Bytes corrompidos | altera bytes do payload |

Também é possível ignorar o ACK (o frame é reenviado com o mesmo serial), atrasar a resposta com variação aleatória, mudar o site, aplicar desvio no relógio do equipamento (o log real mostra -3 min 26 s) e definir o próximo serial, inclusive perto de `0xFFFFFFFF`.

**Cenário do veículo** (por evento, em `src/server/generation/presets.ts`): excesso de peso, gross acima de 65535, índice sem mapeamento (110-118), leitura inválida (119), mais de 10 eixos (120), classe incoerente com os eixos, temperatura negativa e velocidade zero. Todos saem do histórico real do `wim_vbv`.

**Câmera**: imagem antes do frame, depois do frame ou sem imagem, chance de placa não lida (`_unknown.jpg` ou `_.jpg`), fuga em `WIM_XX_ESCAPE` com placa lida errada, e desvio do relógio da câmera.

**Replay**: abra um log do `Main.java`. Os frames `FF 06` reais são reenviados exatamente como o equipamento mandou.

**Perfil realista**: a classe é sorteada pela distribuição real do `wim_vbv` (índice 77 é o mais comum).

## Classes

`config/classes.json` foi gerado a partir de `veh_class` e `veh_idx` do cliente, com o peso de cada índice tirado do `wim_vbv`. Só 3 códigos de texto do frame são conhecidos pelos logs (77 = `I1`, 33 = `B2`, 75 = `H2`). Os demais ficam vazios. O campo `imageFolder` liga cada classe a uma pasta de `assets/img`.

## Estrutura

```
src/shared/        contrato entre servidor e interface
src/server/
  protocol/        layout do frame, encoder, decoder e data de 8 bytes
  equipment/       máquina de estados poll/ACK, fila, serial e relógio
  behaviors/       estratégias de resposta ao poll
  transport/       porta serial (serialport) com reconexão
  generation/      classes, placas, sorteios e presets
  scheduler/       aparição, fuga e emissão automática
  camera/          nomes de arquivo, tempo da imagem e cliente FTP
  replay/          leitura de logs do Main.java
  config/          persistência em config/*.json e validação
  app/             composição e casos de uso
  api/             REST e WebSocket
src/web/           interface React + styled-components
tests/             vitest (unidade e integração com serial simulada e FTP real)
scripts/           contrato com o Main.java e FTP local
```

## Comandos

| Comando | Para quê |
|---|---|
| `npm test` | toda a suíte |
| `npm run contract:java` | frames do simulador passam pelo parser real do `Main.java` |
| `npm run typecheck` | checagem de tipos |
| `npm run ftp:local` | FTP de teste (`FTP_PORT`, `FTP_USER`, `FTP_PASSWORD`, `FTP_ROOT`) |
| `npm run dev` | servidor e interface com hot reload |

Configuração de execução (`config/settings.json`, `events.json`, `camera.json`, `equipment-state.json`, `scenarios/`) e logs (`logs/simulator-<dia>.log`) ficam fora do git.
