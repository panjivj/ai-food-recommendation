import { spawn } from 'node:child_process'
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const setupOnly = process.argv.includes('--setup-only')
const services = [
  {
    directory: path.join(projectRoot, 'backend'),
    label: 'backend',
  },
  {
    directory: path.join(projectRoot, 'mobile'),
    label: 'mobile',
  },
]

function log(message) {
  process.stdout.write(`[local] ${message}\n`)
}

function fail(message) {
  process.stderr.write(`[local] ERROR: ${message}\n`)
}

async function exists(target) {
  try {
    await stat(target)
    return true
  } catch {
    return false
  }
}

async function ensureEnvironment(directory, label) {
  const environmentPath = path.join(directory, '.env')
  if (await exists(environmentPath)) return

  const examplePath = path.join(directory, '.env.example')
  await copyFile(examplePath, environmentPath)
  log(`${label}/.env dibuat dari .env.example`)
}

async function run(command, arguments_, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: options.cwd ?? projectRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          `${command} ${arguments_.join(' ')} gagal` +
            (signal ? ` karena ${signal}` : ` dengan exit code ${code}`),
        ),
      )
    })
  })
}

async function prepareService(service) {
  await ensureEnvironment(service.directory, service.label)

  if (!(await exists(path.join(service.directory, 'node_modules')))) {
    log(`Dependency ${service.label} belum tersedia; menjalankan npm install...`)
    await run('npm', ['install'], { cwd: service.directory })
  }
}

async function readEnvironment(filePath) {
  const content = await readFile(filePath, 'utf8')
  const values = {}

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    values[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2')
  }

  return values
}

async function assertPortAvailable(port, label) {
  await new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', (error) => {
      reject(
        new Error(
          `Port ${port} untuk ${label} sedang digunakan. ` +
            'Hentikan proses tersebut lalu coba kembali.',
          { cause: error },
        ),
      )
    })
    server.listen({ host: '0.0.0.0', port, exclusive: true }, () => {
      server.close(resolve)
    })
  })
}

function prefixOutput(stream, label, target) {
  const lines = createInterface({ input: stream })
  lines.on('line', (line) => {
    target.write(`[${label}] ${line}\n`)
  })
  return lines
}

function startService(label, directory, arguments_) {
  const detached = process.platform !== 'win32'
  const child = spawn('npm', arguments_, {
    cwd: directory,
    detached,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const output = prefixOutput(child.stdout, label, process.stdout)
  const errors = prefixOutput(child.stderr, label, process.stderr)

  return {
    child,
    output,
    errors,
    exited: new Promise((resolve) => {
      child.once('exit', (code, signal) => {
        output.close()
        errors.close()
        resolve({ code, signal })
      })
    }),
  }
}

function signalService(service, signal) {
  const pid = service.child.pid
  if (!pid || service.child.exitCode !== null) return

  try {
    if (process.platform === 'win32') {
      service.child.kill(signal)
    } else {
      process.kill(-pid, signal)
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

async function waitForUrl(url, label, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        log(`${label} siap: ${url}`)
        return
      }
    } catch {
      // Service is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`${label} tidak siap dalam ${timeoutMs / 1000} detik`)
}

async function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (nodeMajor < 22) {
    throw new Error(
      `Node.js 22 atau lebih baru diperlukan; versi aktif ${process.versions.node}.`,
    )
  }

  await mkdir(path.join(projectRoot, 'scripts'), { recursive: true })
  for (const service of services) {
    await prepareService(service)
  }

  log('Menjalankan migration SQLite...')
  await run('npm', ['run', 'db:migrate'], {
    cwd: path.join(projectRoot, 'backend'),
  })

  if (setupOnly) {
    log('Setup lokal selesai. Jalankan npm run dev untuk memulai aplikasi.')
    return
  }

  const backendEnvironment = await readEnvironment(
    path.join(projectRoot, 'backend', '.env'),
  )
  const backendPort = Number(backendEnvironment.PORT ?? 3000)
  const frontendPort = Number(process.env.LOCAL_FRONTEND_PORT ?? 5173)

  if (!Number.isInteger(backendPort) || !Number.isInteger(frontendPort)) {
    throw new Error('PORT backend atau LOCAL_FRONTEND_PORT tidak valid.')
  }

  await assertPortAvailable(backendPort, 'backend')
  await assertPortAvailable(frontendPort, 'frontend')

  const backend = startService(
    'backend',
    path.join(projectRoot, 'backend'),
    ['run', 'dev'],
  )
  const frontend = startService(
    'mobile',
    path.join(projectRoot, 'mobile'),
    [
      'run',
      'dev',
      '--',
      '--host',
      '0.0.0.0',
      '--port',
      String(frontendPort),
      '--strictPort',
    ],
  )
  const runningServices = [backend, frontend]
  let stopping = false
  let finish
  const finished = new Promise((resolve) => {
    finish = resolve
  })

  async function shutdown(exitCode, reason) {
    if (stopping) return
    stopping = true

    if (reason) log(reason)
    for (const service of runningServices) {
      signalService(service, 'SIGTERM')
    }

    const cleanExit = Promise.all(
      runningServices.map((service) => service.exited),
    )
    const timeout = new Promise((resolve) =>
      setTimeout(resolve, 3_000),
    )
    await Promise.race([cleanExit, timeout])

    for (const service of runningServices) {
      signalService(service, 'SIGKILL')
    }

    process.exitCode = exitCode
    finish()
  }

  process.once('SIGINT', () => {
    void shutdown(0, 'Menghentikan backend dan frontend...')
  })
  process.once('SIGTERM', () => {
    void shutdown(0, 'Menghentikan backend dan frontend...')
  })

  runningServices.forEach((service, index) => {
    void service.exited.then(({ code, signal }) => {
      if (!stopping) {
        const label = index === 0 ? 'Backend' : 'Frontend'
        fail(
          `${label} berhenti tak terduga` +
            (signal ? ` (${signal})` : ` (exit code ${code})`),
        )
        void shutdown(code ?? 1)
      }
    })
  })

  try {
    await Promise.all([
      waitForUrl(
        `http://localhost:${backendPort}/api/v1/health`,
        'Backend',
      ),
      waitForUrl(`http://localhost:${frontendPort}`, 'Frontend'),
    ])
    log('Aplikasi lokal berjalan. Tekan Ctrl+C untuk menghentikan semuanya.')
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
    await shutdown(1)
  }

  await finished
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
