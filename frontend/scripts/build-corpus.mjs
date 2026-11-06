// 构建期语料生成器：把「32 张结果卡 × 14 个占卜类型」展开成 448 段完整文案，
// 落盘为静态 JSON。运行时只读这个 JSON，不调用任何模型、不联网、不现场拼句。
//
// 用法：npm run corpus
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CARDS } from './corpus-cards.mjs'
import { TOPIC_KEYS, TOPIC_VARIANTS, BRIDGES, ENDINGS } from './corpus-topics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', 'src', 'data', 'reading-corpus.ts')

const RED = /(预测|占卜|吉凶|运势|命数|注定|宜忌|建议|决策|应该|务必|化解|转运|祈福|测算结果)/

function hash(parts) {
  let h = 2166136261
  for (const p of parts) {
    h ^= p | 0
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
const pick = (arr, seed) => arr[seed % arr.length]

// ---- 素材完整性校验 ----
if (CARDS.length !== 32) throw new Error(`结果卡应为 32 张，实际 ${CARDS.length}`)
if (TOPIC_KEYS.length !== 14) throw new Error(`类型应为 14 个，实际 ${TOPIC_KEYS.length}`)
for (const key of TOPIC_KEYS) {
  const v = TOPIC_VARIANTS[key]
  if (!Array.isArray(v) || v.length !== 4) throw new Error(`类型 ${key} 应有 4 条变体`)
}

const entries = {}
const bodies = new Set()
let minLen = Infinity
let maxLen = 0
const problems = []

CARDS.forEach((card, i) => {
  TOPIC_KEYS.forEach((key, j) => {
    const base = hash([i * 31 + 7, j * 17 + 3])
    const bridge = pick(BRIDGES, hash([base, 1]))
    const variant = pick(TOPIC_VARIANTS[key], hash([base, 2]))
    const ending = pick(ENDINGS, hash([base, 3]))
    const body = card.desc + bridge + variant + ending
    const id = `${card.id}|${key}`
    const len = Array.from(body).length
    if (len < 90) problems.push(`${id} 过短 ${len} 字`)
    if (RED.test(body)) problems.push(`${id} 命中红线词`)
    if (bodies.has(body)) problems.push(`${id} 文案重复`)
    bodies.add(body)
    minLen = Math.min(minLen, len)
    maxLen = Math.max(maxLen, len)
    entries[id] = body
  })
})

const count = Object.keys(entries).length
if (count !== 448) problems.push(`条目数应为 448，实际 ${count}`)
if (problems.length) {
  console.error('语料校验未通过：\n' + problems.slice(0, 20).join('\n'))
  process.exit(1)
}

const payload = {
  version: 1,
  generatedBy: 'WorkBuddy 会话内预生成（构建期），运行时零调用、零联网',
  cardCount: CARDS.length,
  topicCount: TOPIC_KEYS.length,
  entryCount: count,
  cards: CARDS.map(({ id, title }) => ({ id, title })),
  entries,
}

const header = `// 自动生成，请勿手改；由 npm run corpus 重新生成。
// 构建期预生成语料：运行时只读，不调用任何模型、不联网、不现场拼句。
export type CorpusPayload = {
  version: number
  generatedBy: string
  cardCount: number
  topicCount: number
  entryCount: number
  cards: { id: string; title: string }[]
  entries: Record<string, string>
}
const corpus: CorpusPayload = `

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, header + JSON.stringify(payload) + '\n\nexport default corpus\n', 'utf8')
console.log(`已生成 ${count} 条完整文案 → ${outPath}`)
console.log(`唯一文案 ${bodies.size} 条，正文 ${minLen}~${maxLen} 字，红线词 0`)
