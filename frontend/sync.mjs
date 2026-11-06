// 把 Vite 构建产物同步到项目根目录，保持已发布链接的入口不变。
// 只触碰根 index.html 与根 assets/，绝不递归删除项目根里的其它内容。
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = dirname(fileURLToPath(import.meta.url))
const root = join(frontend, '..')
const dist = join(frontend, 'dist')
const distIndex = join(dist, 'index.html')

if (!existsSync(distIndex)) {
  throw new Error('dist/index.html 不存在，请先运行 vite build')
}

cpSync(distIndex, join(root, 'index.html'))

const rootAssets = join(root, 'assets')
if (existsSync(rootAssets)) rmSync(rootAssets, { recursive: true, force: true })
mkdirSync(rootAssets, { recursive: true })
cpSync(join(dist, 'assets'), rootAssets, { recursive: true })

console.log('已同步：项目根 index.html + assets/')
