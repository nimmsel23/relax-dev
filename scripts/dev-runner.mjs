// Start the Relax UI only; its API is mounted by Coach on :9150.
import { spawn } from 'child_process'

function run(cmd, args, env = {}) {
  const p = spawn(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...env },
  })
  p.on('error', (err) => {
    console.error(`[${cmd}]`, err.message)
    process.exit(1)
  })
  return p
}

const vite = run('./node_modules/.bin/vite', ['--host', '127.0.0.1'], { VITE_API_BASE: '' })

process.on('SIGTERM', () => vite.kill())
process.on('SIGINT', () => vite.kill())
