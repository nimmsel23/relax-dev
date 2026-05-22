// Starts both the API server and Vite in parallel for dev mode.
import { spawn } from 'child_process'

function run(cmd, args, env = {}) {
  const p = spawn(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...env },
  })
  p.on('error', err => { console.error(`[${cmd}]`, err.message); process.exit(1) })
  return p
}

const api  = run('node', ['node_modules/.bin/nodemon', '--watch', 'server.mjs', '--watch', 'server/', '--ext', 'mjs,js', '--signal', 'SIGTERM', 'server.mjs'])
const vite = run('node', ['node_modules/.bin/vite'], { VITE_API_BASE: '' })

process.on('SIGTERM', () => { api.kill(); vite.kill() })
process.on('SIGINT',  () => { api.kill(); vite.kill() })
