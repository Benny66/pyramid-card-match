// QA 诊断入口：纯函数，可被 Node 22 原生 type-stripping 直接运行（无需新依赖）。
// 结构断言 + 双目标可解率 + 随机性指标 + 发牌/提示耗时 + 全程按提示重放采样。
import type { Card, GameState } from './game.ts'
import { createGame, evaluate, selectOrMatch, drawOne } from './game.ts'
import { deriveSolverState, createSolverContext, isSolvable } from './solver.ts'
import { getActiveDealMeta } from './deal.ts'
import { getHint } from './hint.ts'
import type { HintMove } from './hint.ts'

export interface VerifyReport {
  total: number
  structureOk: number
  pyramidSolvable: number
  fullSolvable: number
  /** 平均每次发牌洗了几副牌（含最终接受的那副）；1 表示第一次随机牌局就可解。 */
  avgAttempts: number
  /** 筛选前随机牌局的可解率 ≈ 接受数 / 总洗牌数；构造式发牌下无意义，随机发牌应约 0.67。 */
  rawSolvableRate: number
  /** 金字塔同一行内和为 13 的配对总数均值；构造式发牌恒为 12，随机发牌应明显更低。 */
  avgRowComplementPairs: number
  /** 手牌堆相邻两张和为 13 的对数均值；构造式发牌恒为 12，随机发牌应约 1~2。 */
  avgStockAdjacentPairs: number
  fallbackCount: number
  avgCreateMs: number
  maxCreateMs: number
  avgHintMs: number
  maxHintMs: number
  failures: string[]
  // 扩展（加法）：全程按提示重放采样，供 S2 / S3 自动化替身观察。
  hintSamples: number
  hintPyramidCleared: number
  degradedCount: number
}

export interface HintVerifyReport {
  samples: number
  pyramidCleared: number
  degradedCount: number
  stuckEarly: number
  avgHintMs: number
  maxHintMs: number
  p99HintMs: number
  failures: string[]
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/** 固定种子 RNG，用于注入可复现的 Math.random。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function statsOf(times: number[]): { avg: number; max: number; p99: number } {
  if (times.length === 0) return { avg: 0, max: 0, p99: 0 }
  let sum = 0
  let max = 0
  for (const t of times) {
    sum += t
    if (t > max) max = t
  }
  const sorted = times.slice().sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))
  return { avg: sum / times.length, max, p99: sorted[idx] }
}

function checkStructure(s: GameState): boolean {
  if (s.cards.length !== 52) return false
  if (s.pyramid.length !== 7) return false
  for (let r = 0; r < 7; r++) {
    if (s.pyramid[r].length !== r + 1) return false
  }
  if (s.stock.length !== 24) return false
  const ids = new Set<number>()
  const valueCount: number[] = new Array<number>(14).fill(0)
  for (const c of s.cards) {
    if (ids.has(c.id)) return false
    ids.add(c.id)
    if (c.value < 1 || c.value > 13) return false
    valueCount[c.value] += 1
  }
  for (let v = 1; v <= 13; v++) {
    if (valueCount[v] !== 4) return false
  }
  return true
}

function pyramidCleared(s: GameState): boolean {
  return deriveSolverState(s).alive === 0
}

/** 随机性指标 1：每行内部能凑成 13 的配对数之和（构造式发牌恒为 12）。 */
function rowComplementPairs(s: GameState): number {
  let total = 0
  for (const row of s.pyramid) {
    const cnt: number[] = new Array<number>(14).fill(0)
    for (const c of row) cnt[c.value] += 1
    for (let v = 1; v <= 6; v++) total += Math.min(cnt[v], cnt[13 - v])
  }
  return total
}

/** 随机性指标 2：手牌堆相邻两张凑 13 的对数（构造式发牌恒为 12）。 */
function stockAdjacentPairs(s: GameState): number {
  let n = 0
  for (let i = 0; i + 1 < s.stock.length; i++) {
    if (s.stock[i].value + s.stock[i + 1].value === 13) n += 1
  }
  return n
}

/** 把提示走法忠实重放到真实 GameState（selectOrMatch / drawOne 原逻辑）。 */
function applyHintMove(s: GameState, move: HintMove): boolean {
  const byId = new Map<number, Card>()
  for (const c of s.cards) byId.set(c.id, c)
  if (move.kind === 'draw') return drawOne(s)
  if (move.kind === 'singleK') {
    const c = byId.get(move.cards[0])
    if (!c) return false
    return selectOrMatch(s, c) === 'removed'
  }
  const a = byId.get(move.cards[0])
  const b = byId.get(move.cards[1])
  if (!a || !b) return false
  s.selectedId = null
  selectOrMatch(s, a)
  return selectOrMatch(s, b) === 'removed'
}

/** 从 N 副随机牌局出发全程只按 getHint() 走，统计金字塔清空 / degraded / 耗时。 */
export function verifyHints(samples: number): HintVerifyReport {
  const rep: HintVerifyReport = {
    samples,
    pyramidCleared: 0,
    degradedCount: 0,
    stuckEarly: 0,
    avgHintMs: 0,
    maxHintMs: 0,
    p99HintMs: 0,
    failures: [],
  }
  const times: number[] = []
  for (let i = 0; i < samples; i++) {
    const s = createGame()
    let guard = 0
    while (!pyramidCleared(s) && guard < 300) {
      guard += 1
      if (evaluate(s) !== 'playing') {
        rep.stuckEarly += 1
        break
      }
      const t0 = now()
      const r = getHint(s)
      times.push(now() - t0)
      if (r.degraded) rep.degradedCount += 1
      if (!r.move) {
        rep.stuckEarly += 1
        break
      }
      if (!applyHintMove(s, r.move)) {
        rep.stuckEarly += 1
        break
      }
    }
    if (pyramidCleared(s)) rep.pyramidCleared += 1
    else rep.failures.push('#' + i + ' 按提示未能清空金字塔')
  }
  const st = statsOf(times)
  rep.avgHintMs = st.avg
  rep.maxHintMs = st.max
  rep.p99HintMs = st.p99
  return rep
}

/** S1 主入口：批量调用 createGame()（真实路径：随机洗牌 + 死局过滤）。 */
export function verifyDeals(n: number, options: { seed?: number } = {}): VerifyReport {
  const report: VerifyReport = {
    total: n,
    structureOk: 0,
    pyramidSolvable: 0,
    fullSolvable: 0,
    avgAttempts: 0,
    rawSolvableRate: 0,
    avgRowComplementPairs: 0,
    avgStockAdjacentPairs: 0,
    fallbackCount: 0,
    avgCreateMs: 0,
    maxCreateMs: 0,
    avgHintMs: 0,
    maxHintMs: 0,
    failures: [],
    hintSamples: 0,
    hintPyramidCleared: 0,
    degradedCount: 0,
  }
  const originalRandom = Math.random
  if (options.seed !== undefined) Math.random = mulberry32(options.seed)
  try {
    const createTimes: number[] = []
    const hintTimes: number[] = []
    let totalAttempts = 0
    let rowPairsSum = 0
    let stockPairsSum = 0

    for (let i = 0; i < n; i++) {
      const t0 = now()
      const s = createGame()
      createTimes.push(now() - t0)

      if (!checkStructure(s)) {
        report.failures.push('#' + i + ' 结构断言失败')
        continue
      }
      report.structureOk += 1

      const st = deriveSolverState(s)
      const pv = isSolvable(st, { goal: 'pyramid', context: createSolverContext(50_000, 40) })
      if (pv === 'solvable') report.pyramidSolvable += 1
      else report.failures.push('#' + i + ' pyramid=' + pv)
      const fv = isSolvable(st, { goal: 'full', context: createSolverContext(50_000, 40) })
      if (fv === 'solvable') report.fullSolvable += 1
      else report.failures.push('#' + i + ' full=' + fv)

      const meta = getActiveDealMeta()
      totalAttempts += meta.stats.attempts
      if (meta.stats.fallback) report.fallbackCount += 1
      rowPairsSum += rowComplementPairs(s)
      stockPairsSum += stockAdjacentPairs(s)

      const h0 = now()
      getHint(s)
      hintTimes.push(now() - h0)
    }

    report.avgAttempts = totalAttempts / Math.max(1, n)
    report.rawSolvableRate = totalAttempts > 0 ? n / totalAttempts : 0
    report.avgRowComplementPairs = rowPairsSum / Math.max(1, n)
    report.avgStockAdjacentPairs = stockPairsSum / Math.max(1, n)

    const cs = statsOf(createTimes)
    report.avgCreateMs = cs.avg
    report.maxCreateMs = cs.max
    const hs = statsOf(hintTimes)
    report.avgHintMs = hs.avg
    report.maxHintMs = hs.max

    const hintSamples = Math.min(n, 20)
    const hv = verifyHints(hintSamples)
    report.hintSamples = hv.samples
    report.hintPyramidCleared = hv.pyramidCleared
    report.degradedCount = hv.degradedCount
    for (const f of hv.failures) report.failures.push('hint: ' + f)
  } finally {
    Math.random = originalRandom
  }
  return report
}
