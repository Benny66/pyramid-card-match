// 构造式可解发牌：先造合法消除计划，再倒推把真实 52 张牌填进 28 塔位 + 24 手牌。
// 对 game.ts 只有 import type（编译期擦除），因此 game.ts → deal.ts → solver.ts 无运行时环。
import type { Card, GameState } from './game.ts'
import type { SolverGoal } from './solver.ts'
import {
  deriveSolverState,
  isSolvable,
  createSolverContext,
  wasteBalanced,
  pyramidIndex,
  isExposedAt,
} from './solver.ts'

export interface DealOptions {
  rng?: () => number
  goal?: SolverGoal
  nodeBudget?: number
  deadlineMs?: number
  maxAttempts?: number
}

export interface PlannedAction {
  kind: 'pairPP' | 'singleK' | 'pairWW'
  a: number
  b: number | null
}

export interface DealMeta {
  plannedPartner: Map<number, number | null>
  plannedWastePairs: Array<[number, number]>
  plan: PlannedAction[]
  stats: { ms: number; fallback: boolean; goal: SolverGoal }
}

interface BuildResult {
  state: GameState
  meta: DealMeta
}

// 模块级单例：全场只有一副活动牌；createGame() 每次刷新；不进 Vue 响应式。
let activeDealMeta: DealMeta = emptyMeta('full')

function emptyMeta(goal: SolverGoal): DealMeta {
  return {
    plannedPartner: new Map<number, number | null>(),
    plannedWastePairs: [],
    plan: [],
    stats: { ms: 0, fallback: true, goal },
  }
}

/** 固定种子 RNG，供 L2 确定性兜底使用。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 本地 Fisher-Yates（用注入 rng，避免运行时依赖 game.ts 的 shuffle）。 */
function shuffleWith<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/**
 * 单次构造（架构 §1.2 的 8 步）。
 * 返回 null 表示本次构造不合法（触发 L1 重试 / L2 / L3），不抛异常给上层。
 */
function buildAttempt(deck: Card[], rng: () => number, goal: SolverGoal): BuildResult | null {
  // 1) 按 value 分桶，每桶 4 张；先 shuffle 保证花色观感随机。
  const buckets: Card[][] = new Array<Card[]>(14)
  for (let v = 0; v <= 13; v++) buckets[v] = []
  for (const card of deck) {
    if (card.value < 1 || card.value > 13) return null
    buckets[card.value].push(card)
  }
  for (let v = 1; v <= 13; v++) {
    if (buckets[v].length !== 4) return null
    shuffleWith(buckets[v], rng)
  }

  // 2) 塔位配对计划：逐行 shuffle，奇数行落单 1 张作为 K 位，其余行内两两成对。
  const pairs: Array<[number, number]> = []
  const kPos: number[] = []
  const rowPairs: Array<Array<[number, number]>> = []
  const rowK: Array<number | null> = new Array<number | null>(7).fill(null)
  for (let r = 0; r < 7; r++) {
    const positions: number[] = []
    for (let c = 0; c <= r; c++) positions.push(pyramidIndex(r, c))
    shuffleWith(positions, rng)
    let k: number | null = null
    if (positions.length % 2 === 1) k = positions.pop() as number
    const rp: Array<[number, number]> = []
    for (let i = 0; i + 1 < positions.length; i += 2) {
      rp.push([positions[i], positions[i + 1]])
    }
    rowPairs.push(rp)
    rowK[r] = k
    for (const pair of rp) pairs.push(pair)
    if (k !== null) kPos.push(k)
  }
  if (pairs.length !== 12 || kPos.length !== 4) return null
  const covered = new Set<number>()
  for (const [p, q] of pairs) {
    covered.add(p)
    covered.add(q)
  }
  for (const p of kPos) covered.add(p)
  if (covered.size !== 28) return null

  // 3) 12 个互补类（v=1..6 各 2 个 [v, 13-v]），逐对分配塔位 value。
  const classes: Array<[number, number]> = []
  for (let v = 1; v <= 6; v++) {
    classes.push([v, 13 - v])
    classes.push([v, 13 - v])
  }
  shuffleWith(classes, rng)

  const towerValues: number[] = new Array<number>(28).fill(0)
  const positionPairList: Array<[number, number]> = []
  for (let i = 0; i < 12; i++) {
    const [p, q] = pairs[i]
    const cls = classes[i]
    const flip = rng() < 0.5
    const vp = flip ? cls[0] : cls[1]
    const vq = flip ? cls[1] : cls[0]
    towerValues[p] = vp
    towerValues[q] = vq
    positionPairList.push([p, q])
  }
  // 4) 4 个 K 位 ← value 13。
  for (const p of kPos) towerValues[p] = 13

  // 从桶中取出 28 张真实塔牌（value 1..12 各 2 张 + 4 张 K）。
  const towerCards: Card[] = new Array<Card>(28)
  for (let p = 0; p < 28; p++) {
    const v = towerValues[p]
    const card = buckets[v].pop()
    if (!card) return null
    towerCards[p] = card
  }

  // 5) 剩余的 value 1..12 各 2 张 = 24 张手牌，按 [v, 13-v] 互补对相邻排列。
  const wastePairsCards: Array<[Card, Card]> = []
  for (let v = 1; v <= 6; v++) {
    while (buckets[v].length > 0 && buckets[13 - v].length > 0) {
      wastePairsCards.push([buckets[v].pop() as Card, buckets[13 - v].pop() as Card])
    }
  }
  for (let v = 1; v <= 13; v++) {
    if (buckets[v].length !== 0) return null
  }
  shuffleWith(wastePairsCards, rng)
  const stockOrder: Card[] = []
  for (const [a, b] of wastePairsCards) {
    if (rng() < 0.5) stockOrder.push(a, b)
    else stockOrder.push(b, a)
  }
  if (stockOrder.length !== 24) return null

  // 6) 装配 GameState：完全沿用 game.ts 现有 r/c 循环与字段形状，一个字段不加。
  const cards: Card[] = []
  const pyramid: Card[][] = []
  for (let r = 0; r < 7; r++) {
    const row: Card[] = []
    for (let c = 0; c <= r; c++) {
      const card = towerCards[pyramidIndex(r, c)]
      card.zone = 'pyramid'
      card.r = r
      card.c = c
      card.removed = false
      row.push(card)
      cards.push(card)
    }
    pyramid.push(row)
  }
  for (const card of stockOrder) {
    card.zone = 'stock'
    card.r = -1
    card.c = -1
    card.removed = false
    cards.push(card)
  }
  const state: GameState = {
    cards,
    pyramid,
    stock: stockOrder,
    waste: [],
    selectedId: null,
    steps: 0,
    startedAt: Date.now(),
    finished: false,
    busy: false,
    lastFlipId: null,
  }

  // 参考解元数据：塔牌互指 / K 为 null / 手牌互补对。
  const plannedPartner = new Map<number, number | null>()
  for (const [p, q] of positionPairList) {
    plannedPartner.set(towerCards[p].id, towerCards[q].id)
    plannedPartner.set(towerCards[q].id, towerCards[p].id)
  }
  for (const p of kPos) plannedPartner.set(towerCards[p].id, null)

  const plannedWastePairs: Array<[number, number]> = wastePairsCards.map(
    ([a, b]): [number, number] => [a.id, b.id],
  )

  // plan：自底向上逐行（r=6→0），行内配对 + 奇数行落单 K；末尾追加 12 对手牌清算。
  const plan: PlannedAction[] = []
  for (let r = 6; r >= 0; r--) {
    for (const [p, q] of rowPairs[r]) plan.push({ kind: 'pairPP', a: p, b: q })
    if (rowK[r] !== null) plan.push({ kind: 'singleK', a: rowK[r] as number, b: null })
  }
  for (const [a, b] of wastePairsCards) {
    plan.push({ kind: 'pairWW', a: a.id, b: b.id })
  }

  const meta: DealMeta = {
    plannedPartner,
    plannedWastePairs,
    plan,
    stats: { ms: 0, fallback: false, goal },
  }
  return { state, meta }
}

/**
 * O(28 + 12) 构造性证明：按计划自底向上执行，逐步校验 isExposedAt / 互补 / 明牌计数，
 * 最终 alive===0 且 wasteBalanced(pool)。使用 solver.ts 的位掩码等价判定，不重写规则。
 */
export function replayPlan(state: GameState, plan: PlannedAction[]): boolean {
  const st = deriveSolverState(state)
  let alive = st.alive
  const pool = st.pool.slice()
  const values = st.values
  const byId = new Map<number, Card>()
  for (const card of state.cards) byId.set(card.id, card)

  for (const act of plan) {
    if (act.kind === 'singleK') {
      const p = act.a
      if (p < 0 || p >= 28 || values[p] !== 13) return false
      if (!isExposedAt(alive, p)) return false
      alive &= ~(1 << p)
    } else if (act.kind === 'pairPP') {
      const p = act.a
      const q = act.b
      if (q === null) return false
      if (p < 0 || p >= 28 || q < 0 || q >= 28) return false
      if (!isExposedAt(alive, p) || !isExposedAt(alive, q)) return false
      if (values[p] + values[q] !== 13) return false
      alive &= ~(1 << p)
      alive &= ~(1 << q)
    } else {
      const ca = byId.get(act.a)
      const cb = byId.get(act.b === null ? -1 : act.b)
      if (!ca || !cb) return false
      if (ca.value + cb.value !== 13) return false
      if (ca.value < 1 || ca.value > 13 || cb.value < 1 || cb.value > 13) return false
      pool[ca.value] -= 1
      pool[cb.value] -= 1
      if (pool[ca.value] < 0 || pool[cb.value] < 0) return false
    }
  }
  return alive === 0 && wasteBalanced(pool)
}

/** 构造后再做一次求解器双目标确认（构造牌局实测 ≤22 节点）。 */
function validateBuilt(
  state: GameState,
  meta: DealMeta,
  nodeBudget: number,
  deadlineMs: number,
): boolean {
  if (!replayPlan(state, meta.plan)) return false
  const st = deriveSolverState(state)
  const pv = isSolvable(st, { goal: 'pyramid', context: createSolverContext(nodeBudget, deadlineMs) })
  if (pv !== 'solvable') return false
  const fv = isSolvable(st, { goal: 'full', context: createSolverContext(nodeBudget, deadlineMs) })
  if (fv !== 'solvable') return false
  return true
}

/** L3：退回旧版纯 Fisher-Yates + 原装配，结构完整、首屏可点。 */
function legacyAssemble(deck: Card[], rng: () => number): GameState {
  const cards = shuffleWith(deck.slice(), rng)
  const pyramid: Card[][] = []
  let k = 0
  for (let r = 0; r < 7; r++) {
    const row: Card[] = []
    for (let c = 0; c <= r; c++) {
      const card = cards[k++]
      card.zone = 'pyramid'
      card.r = r
      card.c = c
      card.removed = false
      row.push(card)
    }
    pyramid.push(row)
  }
  const stock = cards.slice(k)
  for (const card of stock) {
    card.zone = 'stock'
    card.r = -1
    card.c = -1
    card.removed = false
  }
  return {
    cards,
    pyramid,
    stock,
    waste: [],
    selectedId: null,
    steps: 0,
    startedAt: Date.now(),
    finished: false,
    busy: false,
    lastFlipId: null,
  }
}

/** 构造式可解发牌主入口，含 L1 / L2 / L3 三级兜底，绝不抛异常。 */
export function createSolvableGame(deck: Card[], options: DealOptions = {}): GameState {
  const goal: SolverGoal = options.goal ?? 'full'
  const nodeBudget = options.nodeBudget ?? 50_000
  const deadlineMs = options.deadlineMs ?? 40
  const maxAttempts = options.maxAttempts ?? 3
  const rng = options.rng ?? Math.random
  const start = Date.now()

  // L1：正常构造（最多 maxAttempts 次构造重试，非洗牌重试）。
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - start > deadlineMs) break
    let built: BuildResult | null = null
    try {
      built = buildAttempt(deck, rng, goal)
    } catch (err) {
      console.warn('[deal] L1 build threw', err)
      built = null
    }
    if (!built) continue
    if (!validateBuilt(built.state, built.meta, nodeBudget, deadlineMs)) continue
    built.meta.stats.ms = Date.now() - start
    built.meta.stats.fallback = false
    activeDealMeta = built.meta
    return built.state
  }

  // L2：固定种子重跑一次构造（确定性、必成功）。
  const fixedRng = mulberry32(0x5eed)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let built: BuildResult | null = null
    try {
      built = buildAttempt(deck, fixedRng, goal)
    } catch (err) {
      console.warn('[deal] L2 build threw', err)
      built = null
    }
    if (!built) continue
    if (!validateBuilt(built.state, built.meta, nodeBudget, deadlineMs)) continue
    built.meta.stats.ms = Date.now() - start
    built.meta.stats.fallback = true
    activeDealMeta = built.meta
    return built.state
  }

  // L3：纯随机兜底，参考解置空。
  console.warn('[deal] fallback to legacy')
  const state = legacyAssemble(deck, rng)
  const meta = emptyMeta(goal)
  meta.stats.ms = Date.now() - start
  activeDealMeta = meta
  return state
}

/** hint.ts 只读参考解；createGame() 每次刷新，不参与响应式。 */
export function getActiveDealMeta(): DealMeta {
  return activeDealMeta
}
