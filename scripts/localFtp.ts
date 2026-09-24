import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bunyan from 'bunyan'
import { FtpSrv } from 'ftp-srv'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FTP_ROOT = path.resolve(process.env.FTP_ROOT ?? path.join(ROOT, '.ftp-root'))
const PORT = Number(process.env.FTP_PORT ?? 2121)
const USER = process.env.FTP_USER ?? 'tracevia'
const PASSWORD = process.env.FTP_PASSWORD ?? 'teste'

mkdirSync(path.join(FTP_ROOT, 'WIM'), { recursive: true })

const server = new FtpSrv({
  url: `ftp://127.0.0.1:${PORT}`,
  pasv_url: '127.0.0.1',
  pasv_min: PORT + 100,
  pasv_max: PORT + 150,
  anonymous: false,
  log: bunyan.createLogger({ name: 'ftp-local', level: 'warn' }),
})

server.on('login', ({ username, password }, resolve, reject) => {
  if (username === USER && password === PASSWORD) resolve({ root: FTP_ROOT })
  else reject(new Error('usuário ou senha inválidos'))
})

server.listen().then(() => {
  console.log(`FTP local em ftp://${USER}:${PASSWORD}@127.0.0.1:${PORT}`)
  console.log(`Arquivos em ${FTP_ROOT}`)
})
