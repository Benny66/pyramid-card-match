// 纯同步求解器：不依赖 DOM / 网络 / .vue，可被 Node 22 原生 type-stripping 直接运行。
// 状态为 28 位 alive 掩码 + pool[14] 计数；松弛假设（未翻手牌视为已在明牌区）
// 已由架构 §1.4 忠实重放验证为精确，故 draw 不改变 (alive, pool)。
import type { GameState } from './game.ts'

export type SolverGoal = 'pyramid' | 'full'
export type SolveVerdict = 'solvable' | 'unsolvable' | 'unknown'

export interface SolverState {
  values: number[]
  alive: number
  pool: number[]
}

export interface SolverContext {
  memo: Map<string, SolveVerdict>
  nodeBudget: number
  deadlineMs: number
  startAt: number
  nodes: number
  exhausted: boolean
}

export interface SolverOptions {
  goal: SolverGoal
  context: SolverContext
}

/** hint.ts 传给 projectMove 的最小结构；刻意不 import hint.ts，避免反向依赖。 */
export interface HintMoveLikeCard {
  value: number
  zone: string
  r: number
  c: number
}
export interface HintMoveLike {
  kind: 'pair' | 'singleK' | 'draw'
  cards: HintMoveLikeCard[]
}

/** 位置编码：r=0 塔尖 … r=6 底层，p = r*(r+1)/2 + c。 */
export function pyramidIndex(r: number, c: number): number {
  return (r * (r + 1)) / 2 + c
}

/** childrenMask[p]：p=(r,c) 被 (r+1,c)、(r+1,c+1) 压住；r=6 为 0。 */
export const childrenMask: number[] = buildChildrenMask()

function buildChildrenMask(): number[] {
  const mask: number[] = new Array<number>(28).fill(0)
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c <= r; c++) {
      const p = pyramidIndex(r, c)
      if (r < 6) {
        const left = pyramidIndex(r + 1, c)
        const right = pyramidIndex(r + 1, c + 1)
        mask[p] = (1 << left) | (1 << right)
      } else {
        mask[p] = 0
      }
    }
  }
  return mask
}

/**
 * game.ts::isExposed 的位掩码等价实现：
 * 该塔位仍在，且其两个子塔位都已消除，才算「完全露出」。
 */
export function isExposedAt(alive: number, p: number): boolean {
  return ((alive >>> p) & 1) === 1 && (alive & childrenMask[p]) === 0
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/** 每次调用从实时 GameState 推导，不缓存、不持久化。 */
export function deriveSolverState(s: GameState): SolverState {
  const values: number[] = new Array<number>(28).fill(0)
  let alive = 0
  for (let r = 0; r < 7; r++) {
    const row = s.pyramid[r]
    for (let c = 0; c <= r; c++) {
      const p = pyramidIndex(r, c)
      const card = row[c]
      values[p] = card.value
      if (!card.removed) alive |= 1 << p
    }
  }
  // 松弛语义：stock（未翻手牌）+ waste（已翻明牌）都视为当前可用明牌。
  const pool: number[] = new Array<number>(14).fill(0)
  for (const card of s.stock) {
    if (!card.removed && card.value >= 1 && card.value <= 13) pool[card.value] += 1
  }
  for (const card of s.waste) {
    if (!card.removed && card.value >= 1 && card.value <= 13) pool[card.value] += 1
  }
  return { values, alive, pool }
}

export function createSolverContext(
  nodeBudget: number = 20_000,
  deadlineMs: number = 12,
): SolverContext {
  return {
    memo: new Map<string, SolveVerdict>(),
    nodeBudget,
    deadlineMs,
    startAt: now(),
    nodes: 0,
    exhausted: false,
  }
}

/** 52 张全消终点：塔清空后剩余明牌须能两两互补；K 恒可单消，不参与。 */
export function wasteBalanced(pool: number[]): boolean {
  for (let v = 1; v <= 6; v++) {
    if (pool[v] !== pool[13 - v]) return false
  }
  return true
}

export function isSolvable(state: SolverState, options: SolverOptions): SolveVerdict {
  return solve(state.alive, state.pool, state.values, options.goal, options.context)
}

function solve(
  aliveIn: number,
  pool: number[],
  values: number[],
  goal: SolverGoal,
  ctx: SolverContext,
): SolveVerdict {
  // 剪枝 #2：露出的塔 K 立即单消（不消耗资源、只解锁上层，永不劣化），
  // 连锁进行直到无露出 K，再计算记忆化 key，显著压缩状态。
  let alive = aliveIn
  let changed = true
  while (changed) {
    changed = false
    for (let p = 0; p < 28; p++) {
      if (isExposedAt(alive, p) && values[p] === 13) {
        alive &= ~(1 << p)
        changed = true
      }
    }
  }

  // 剪枝 #5：终点判定。
  if (alive === 0) {
    if (goal === 'pyramid') return 'solvable'
    return wasteBalanced(pool) ? 'solvable' : 'unsolvable'
  }

  // 预算 / 超时：耗尽返回 'unknown'（乐观语义），绝不判 'unsolvable'。
  ctx.nodes += 1
  if (ctx.nodes > ctx.nodeBudget || now() - ctx.startAt > ctx.deadlineMs) {
    ctx.exhausted = true
    return 'unknown'
  }

  // key 带 goal 前缀：同一次 getHint 里 hard('pyramid') 与 soft('full')
  // 共用同一个 ctx.memo，两种目标的终点判定不同，必须隔离缓存。
  const key = goal + '|' + alive + '|' + pool.slice(1, 13).join('')
  const cached = ctx.memo.get(key)
  if (cached !== undefined) return cached

  // 剪枝 #1：只枚举完全露出的塔牌（singleK 已在规范化步骤吸收）。
  const exposed: number[] = []
  for (let p = 0; p < 28; p++) {
    if (isExposedAt(alive, p)) exposed.push(p)
  }

  let sawUnknown = false

  // 动作 #1 pairPP：两张露出塔牌互补（p<q 去重，剪枝 #4）。
  for (let i = 0; i < exposed.length; i++) {
    const p = exposed[i]
    for (let j = i + 1; j < exposed.length; j++) {
      const q = exposed[j]
      if (values[p] + values[q] !== 13) continue
      const next = alive & ~(1 << p) & ~(1 << q)
      const v = solve(next, pool, values, goal, ctx)
      if (v === 'solvable') {
        ctx.memo.set(key, 'solvable')
        return 'solvable'
      }
      if (v === 'unknown') sawUnknown = true
    }
  }

  // 动作 #2 pairPW：露出塔牌 value=v 与明牌 value=13-v（剪枝 #4）。
  for (let i = 0; i < exposed.length; i++) {
    const p = exposed[i]
    const v = values[p]
    if (v < 1 || v > 12) continue
    const need = 13 - v
    if (pool[need] <= 0) continue
    const nextPool = pool.slice()
    nextPool[need] -= 1
    const next = alive & ~(1 << p)
    const verdict = solve(next, nextPool, values, goal, ctx)
    if (verdict === 'solvable') {
      ctx.memo.set(key, 'solvable')
      return 'solvable'
    }
    if (verdict === 'unknown') sawUnknown = true
  }

  // 剪枝 #6：缓存失败态（成功态已短路返回）；'unknown' 不缓存。
  if (sawUnknown) return 'unknown'
  ctx.memo.set(key, 'unsolvable')
  return 'unsolvable'
}

/**
 * 把一个候选走法投影成新的 SolverState（绝不修改入参 state / 真实 GameState）。
 * - 塔牌：清掉 alive 对应位；
 * - 明牌：pool[value]--；
 * - draw：松弛语义下 (alive, pool) 不变（见文件头注释），翻牌恒无害。
 */
export function projectMove(state: SolverState, m: HintMoveLike): SolverState {
  const pool = state.pool.slice()
  let alive = state.alive
  if (m.kind !== 'draw') {
    for (const card of m.cards) {
      if (card.zone === 'pyramid') {
        alive &= ~(1 << pyramidIndex(card.r, card.c))
      } else if (card.value >= 1 && card.value <= 13) {
        pool[card.value] -= 1
      }
    }
  }
  return { values: state.values, alive, pool }
}
