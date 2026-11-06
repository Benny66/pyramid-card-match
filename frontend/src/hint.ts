// 提示引擎：6 档严格递减，实时 reachability 为唯一权威，参考解仅作同档排序软偏好。
// 规则判定一律复用 game.ts 的 playableCards / isPair / isPlayable，不写第二份规则。
import type { Card, GameState } from './game.ts'
import { playableCards, isPair, isPlayable } from './game.ts'
import {
  deriveSolverState,
  createSolverContext,
  isSolvable,
  projectMove,
} from './solver.ts'
import type { SolverState } from './solver.ts'
import { getActiveDealMeta } from './deal.ts'
import type { DealMeta } from './deal.ts'

export type HintTier = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface HintMove {
  kind: 'pair' | 'singleK' | 'draw'
  cards: number[]
  tier: HintTier
}

export interface HintResult {
  move: HintMove | null
  tier: HintTier
  text: string
  degraded: boolean
}

/** 内部候选：保留 Card 引用供 projectMove 使用，对外只暴露 id。 */
interface Candidate {
  move: HintMove
  cardObjs: Card[]
  tier: HintTier
}

function tierForPair(a: Card, b: Card): HintTier {
  const ap = a.zone === 'pyramid'
  const bp = b.zone === 'pyramid'
  if (ap && bp) return 1
  if (ap || bp) return 2
  return 4
}

/**
 * 枚举当前局面全部合法走法。
 * K 单消 / 配对 / 翻牌三类；无序对用 id 排序去重。
 */
function enumerateLegalMoves(s: GameState): Candidate[] {
  const list = playableCards(s)
  const result: Candidate[] = []

  // K 单消：档 3（塔 K）/ 档 5（明牌 K）。被压住的 K 不在 playableCards 里。
  for (const card of list) {
    if (card.value === 13) {
      const tier: HintTier = card.zone === 'pyramid' ? 3 : 5
      result.push({
        move: { kind: 'singleK', cards: [card.id], tier },
        cardObjs: [card],
        tier,
      })
    }
  }

  // 配对：isPair 保证和为 13 且非同一张；K 无互补值，天然不进配对。
  const seen = new Set<string>()
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]
      const b = list[j]
      if (!isPair(a, b)) continue
      if (!isPlayable(s, a) || !isPlayable(s, b)) continue
      const key = a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id
      if (seen.has(key)) continue
      seen.add(key)
      const tier = tierForPair(a, b)
      result.push({
        move: { kind: 'pair', cards: [a.id, b.id], tier },
        cardObjs: [a, b],
        tier,
      })
    }
  }

  // 档 6：翻一张手牌（默认补充），避免「有牌可翻却报无提示」。
  if (s.stock.length > 0) {
    result.push({
      move: { kind: 'draw', cards: [], tier: 6 },
      cardObjs: [],
      tier: 6,
    })
  }
  return result
}

/** 参考解命中判定：只用于同档排序，永不绕过 hard 校验。 */
function isOnPlan(m: HintMove, cardObjs: Card[], meta: DealMeta): boolean {
  if (m.kind === 'draw') return true
  if (m.kind === 'singleK') {
    const c = cardObjs[0]
    return Boolean(c && c.zone === 'pyramid' && meta.plannedPartner.has(c.id))
  }
  const a = cardObjs[0]
  const b = cardObjs[1]
  if (!a || !b) return false
  const ap = a.zone === 'pyramid'
  const bp = b.zone === 'pyramid'
  if (ap && bp) {
    return meta.plannedPartner.get(a.id) === b.id
  }
  if (!ap && !bp) {
    return meta.plannedWastePairs.some(
      ([x, y]) => (x === a.id && y === b.id) || (x === b.id && y === a.id),
    )
  }
  return false
}

function cardIdMin(m: HintMove): number {
  if (m.cards.length === 0) return Number.MAX_SAFE_INTEGER
  let min = m.cards[0]
  for (const id of m.cards) if (id < min) min = id
  return min
}

/** 一行短句，随档位变化；按需出现不常驻。 */
export function hintText(tier: HintTier, degraded: boolean): string {
  if (degraded) return '这副牌已经清不掉金字塔了，重新开局可以换一副'
  switch (tier) {
    case 1:
    case 2:
      return '先消金字塔上的这两张'
    case 3:
      return '金字塔上的 K 可以直接点掉'
    case 4:
    case 5:
      return '金字塔暂时配不上，先消明牌这两张'
    case 6:
      return '金字塔暂时配不上，先翻一张手牌'
    default:
      return '这局没有可消的组合了'
  }
}

/**
 * 6 档严格短路挑选下一步：逐候选 projectMove 后硬校验 'pyramid'（只有
 * 'unsolvable' 才跳过）、软偏好 'full'；'unknown' 一律乐观视为可用。
 * 一次调用只创建一个 SolverContext（共享 memo / 总预算 / 总 deadline）。
 */
export function getHint(
  s: GameState,
  options: { nodeBudget?: number; deadlineMs?: number } = {},
): HintResult {
  const ctx = createSolverContext(options.nodeBudget ?? 20_000, options.deadlineMs ?? 12)
  const base: SolverState = deriveSolverState(s)
  const meta = getActiveDealMeta()
  const legal = enumerateLegalMoves(s)

  for (let tier = 1; tier <= 6; tier++) {
    const cands = legal.filter((c) => c.tier === tier)
    if (cands.length === 0) continue
    const scored: Array<{ c: Candidate; soft: boolean; onPlan: boolean }> = []
    for (const c of cands) {
      const after = projectMove(base, { kind: c.move.kind, cards: c.cardObjs })
      const hard = isSolvable(after, { goal: 'pyramid', context: ctx })
      if (hard === 'unsolvable') continue
      const softVerdict = isSolvable(after, { goal: 'full', context: ctx })
      scored.push({
        c,
        soft: softVerdict === 'solvable',
        onPlan: isOnPlan(c.move, c.cardObjs, meta),
      })
    }
    if (scored.length > 0) {
      // 同档排序：onPlan desc → soft desc → cardId asc
      scored.sort((x, y) => {
        if (x.onPlan !== y.onPlan) return x.onPlan ? -1 : 1
        if (x.soft !== y.soft) return x.soft ? -1 : 1
        return cardIdMin(x.c.move) - cardIdMin(y.c.move)
      })
      const best = scored[0].c
      return { move: best.move, tier: best.tier, text: hintText(best.tier, false), degraded: false }
    }
  }

  // 1~6 档都没有「保解」候选：玩家自由乱点已把局面走出可解集。
  if (legal.length > 0) {
    const best = legal.slice().sort((x, y) => {
      if (x.tier !== y.tier) return x.tier - y.tier
      return cardIdMin(x.move) - cardIdMin(y.move)
    })[0]
    return { move: best.move, tier: best.tier, text: hintText(0, true), degraded: true }
  }
  return { move: null, tier: 0, text: '这局没有可消的组合了', degraded: true }
}
