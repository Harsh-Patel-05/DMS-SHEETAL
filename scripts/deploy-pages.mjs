import { copyFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

process.env.GITHUB_PAGES = '1'

// Node refuses to spawn .cmd shims on Windows without a shell (EINVAL)
const spawnOpts = { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' }

function run(cmd, args) {
  const result = spawnSync(cmd, args, spawnOpts)
  if (result.error) console.error(result.error)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['run', 'build'])
copyFileSync('dist/index.html', 'dist/404.html')
run('npx', ['--yes', 'gh-pages', '-d', 'dist', '-b', 'gh-pages', '-m', '"Deploy frontend to GitHub Pages"'])
