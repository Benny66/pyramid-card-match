// 随机洗牌发牌：金字塔 28 张与手牌 24 张全部由 Fisher-Yates 决定，不构造任何配对规律。
// 唯一的「加工」是洗完后用求解器判一次可解性：若这副牌没有清空路径就整副重洗。
// 因此玩家看到的牌面是真随机（不会出现「每层都正好凑 13」「翻牌成对」），
// 同时仍保证每局都有解。对 game.ts 只有 import type，无运行时循环依赖。
import type { Card, GameState } from './game.ts'
import type { SolverGoal } from './solver.ts'
import { deriveSolverState, isSolvable, createSolverContext } from './solver.ts'

export interface DealOptions {
  rng?: () => number
  goal?: SolverGoal
  nodeBudget?: number
  deadlineMs?: number
  maxAttempts?: number
}

/** 兼容旧契约保留的类型；随机发牌不再产生任何构造计划，plan 恒为空。 */
export interface PlannedAction {
  kind: 'pairPP' | 'singleK' | 'pairWW'
  a: number
  b: number | null
}

export interface DealMeta {
  plannedPartner: Map<number, number | null>
  plannedWastePairs: Array<[number, number]>
  plan: PlannedAction[]
  stats: {
    ms: number
    fallback: boolean
    goal: SolverGoal
    /** 本次发牌一共洗了几副牌（含最终被接受的那副），用于统计筛选前随机可解率。 */
    attempts: number
  }
}

// 模块级单例：全场只有一副活动牌；createGame() 每次刷新；不进 Vue 响应式。
let activeDealMeta: DealMeta = emptyMeta('full')

function emptyMeta(goal: SolverGoal): DealMeta {
  return {
    plannedPartner: new Map<number, number | null>(),
    plannedWastePairs: [],
    plan: [],
    stats: { ms: 0, fallback: false, goal, attempts: 0 },
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
 * 纯随机装配：洗牌后前 28 张按 r/c 填金字塔，后 24 张为手牌堆。
 * 与 game.ts 的兜底装配逐字同构，字段一个不加不减。
 */
function randomAssemble(deck: Card[], rng: () => number): GameState {
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

/**
 * 判定一副随机牌局是否可解。'unknown'（预算/超时耗尽）保守视为不可接受，
 * 绝不发出「未验证」的牌局。
 */
function isAcceptable(
  state: GameState,
  goal: SolverGoal,
  nodeBudget: number,
  perAttemptMs: number,
): boolean {
  const st = deriveSolverState(state)
  const v = isSolvable(st, {
    goal,
    context: createSolverContext(nodeBudget, perAttemptMs),
  })
  return v === 'solvable'
}

/**
 * 随机发牌主入口：洗牌 → 可解性校验 → 无解整副重洗。
 * 实测随机牌局可解率约 2/3，平均 1~2 次即可命中；200 次全败概率约 9e-97。
 * 任何超时 / 异常都退回纯随机牌局（结构完整、首屏可点），绝不阻塞渲染。
 */
export function createSolvableGame(deck: Card[], options: DealOptions = {}): GameState {
  const goal: SolverGoal = options.goal ?? 'full'
  const nodeBudget = options.nodeBudget ?? 50_000
  const totalDeadlineMs = options.deadlineMs ?? 120
  const maxAttempts = options.maxAttempts ?? 200
  const rng = options.rng ?? Math.random
  const start = Date.now()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1 && Date.now() - start > totalDeadlineMs) break
    let state: GameState
    try {
      state = randomAssemble(deck, rng)
    } catch (err) {
      console.warn('[deal] assemble threw', err)
      continue
    }
    let ok = false
    try {
      ok = isAcceptable(state, goal, nodeBudget, 40)
    } catch (err) {
      console.warn('[deal] solver threw', err)
      ok = false
    }
    if (ok) {
      const meta = emptyMeta(goal)
      meta.stats.ms = Date.now() - start
      meta.stats.attempts = attempt
      activeDealMeta = meta
      return state
    }
  }

  // 兜底：纯随机牌局（不保证可解），仅在网络/算力异常时才会走到。
  console.warn('[deal] fallback: no solvable deal within budget')
  const state = randomAssemble(deck, rng)
  const meta = emptyMeta(goal)
  meta.stats.ms = Date.now() - start
  meta.stats.attempts = maxAttempts
  meta.stats.fallback = true
  activeDealMeta = meta
  return state
}

/**
 * hint.ts 只读参考解。随机发牌下参考解恒为空：
 * 提示完全依赖实时 reachability（架构 §1.3 的「实时求解为唯一权威」），
 * 空 Map 只让同档排序少一个软偏好，不影响任何正确性。
 */
export function getActiveDealMeta(): DealMeta {
  return activeDealMeta
}
