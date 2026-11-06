// 预生成结果语料的查表层。
// 架构：构建期把「32 张结果卡 × 14 个占卜类型」展开成 448 段完整文案并存盘；
// 运行时只做「确定性映射 → 查表取一整段」，不现场拼句、不调用任何模型、不联网。
// 语料缺条目时才回落到 readings.ts 的本地枚举组合逻辑。
import corpus from './data/reading-corpus.ts'
import { buildReading, type ReadingInput } from './readings.ts'

export type BoardParams = ReadingInput

export interface LookupResult {
  text: string
  source: 'corpus' | 'fallback'
  cardId: string
  cardTitle: string
}

/** 把任意一局结果映射到 32 张结果卡之一（与 scripts/corpus-cards.mjs 的编号规则一致）。 */
export function resolveCardId(p: BoardParams): string {
  const values = p.remainingValues.length ? p.remainingValues : [p.remaining]
  const kLeft = values.filter((v) => v === 13).length
  const distinct = new Set(values).size

  let n: number
  if (p.kind === 'cleared') {
    // C01~C08：消除次数档 × 用时四档
    const s = p.steps > 26 ? 1 : 0
    const e = p.elapsed < 30 ? 0 : p.elapsed < 60 ? 1 : p.elapsed < 120 ? 2 : 3
    n = s * 4 + e + 1
  } else {
    // C09~C32：剩余张数四档 × 剩余 K 三档 × 点数分散度两档。
    // 分散度用「不同点数是否接近剩余张数」衡量，而不是绝对种类数：
    // 否则只剩 3 张牌时种类数永远到不了阈值，会有几张卡永远命中不了。
    const r = p.remaining <= 5 ? 0 : p.remaining <= 12 ? 1 : p.remaining <= 20 ? 2 : 3
    const k = kLeft === 0 ? 0 : kLeft === 1 ? 1 : 2
    // 理论上限是 min(13, 剩余张数)：52 张牌每种点数只有 4 张，
    // 剩得越多越必然重复，用比例而非绝对种类数才能让两档都可达。
    const maxDistinct = Math.min(13, Math.max(1, values.length))
    const d = distinct / maxDistinct >= 0.6 ? 1 : 0
    n = 9 + (r * 3 + k) * 2 + d
  }
  return 'C' + String(n).padStart(2, '0')
}

/** 可注入语料的查表函数，便于单独验证「取不到就走兜底」这条路径。 */
export function lookupWith(
  entries: Record<string, string>,
  cards: { id: string; title: string }[],
  p: BoardParams,
): LookupResult {
  const cardId = resolveCardId(p)
  const cardTitle = cards.find((c) => c.id === cardId)?.title ?? ''
  const hit = entries[`${cardId}|${p.topicKey}`]
  if (hit) {
    return { text: hit, source: 'corpus', cardId, cardTitle }
  }
  // 语料缺条目：回落到本地枚举组合，保证任何情况下都有回答。
  return {
    text: buildReading(p).lines.join(''),
    source: 'fallback',
    cardId,
    cardTitle,
  }
}

export function lookupReading(p: BoardParams): LookupResult {
  return lookupWith(corpus.entries, corpus.cards, p)
}

export const CORPUS_STATS = {
  cards: corpus.cardCount,
  topics: corpus.topicCount,
  entries: corpus.entryCount,
}
