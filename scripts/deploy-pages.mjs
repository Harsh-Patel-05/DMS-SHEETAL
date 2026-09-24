import { copyFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

process.env.GITHUB_PAGES = '1'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const build = spawnSync(npm, ['run', 'build'], { stdio: 'inherit', env: process.env })
if (build.status !== 0) process.exit(build.status ?? 1)

copyFileSync('dist/index.html', 'dist/404.html')

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const publish = spawnSync(
  npx,
  ['--yes', 'gh-pages', '-d', 'dist', '-b', 'gh-pages', '-m', 'Deploy frontend to GitHub Pages'],
  { stdio: 'inherit', env: process.env },
)
process.exit(publish.status ?? 1)
