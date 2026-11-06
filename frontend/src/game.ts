// 纯游戏逻辑：不依赖 DOM、不依赖网络，便于单独验证。
// 规则：52 张牌，A=1…K=13；两张和为 13 消除；K 单点消除；
// 金字塔 7 层共 28 张，其余 24 张为手牌；翻出的牌全部摊开、全部可点、可互相配对。
import { createSolvableGame } from './deal.ts'

export type Zone = 'pyramid' | 'stock' | 'waste'

export interface Card {
  id: number
  suit: string
  red: boolean
  rank: string
  value: number
  zone: Zone
  r: number
  c: number
  removed: boolean
}

export interface GameState {
  cards: Card[]
  pyramid: Card[][]
  stock: Card[]
  waste: Card[]
  selectedId: number | null
  steps: number
  startedAt: number
  finished: boolean
  busy: boolean
  lastFlipId: number | null
}

export type SelectResult = 'selected' | 'deselected' | 'removed' | 'shake' | 'blocked' | 'ignored'
export type GameOutcome = 'playing' | 'cleared' | 'stuck'

const SUITS = [
  { symbol: '♥', red: true },
  { symbol: '♦', red: true },
  { symbol: '♣', red: false },
  { symbol: '♠', red: false },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function createDeck(): Card[] {
  const cards: Card[] = []
  let id = 0
  for (const s of SUITS) {
    for (let i = 0; i < 13; i++) {
      cards.push({
        id: id++, suit: s.symbol, red: s.red, rank: RANKS[i], value: i + 1,
        zone: 'pyramid', r: -1, c: -1, removed: false,
      })
    }
  }
  return cards
}

// 标准 Fisher-Yates：从后往前，j 取自 [0, i]。
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function createGame(): GameState {
  try {
    // 签名不变、语义改为「构造式可解发牌」；返回纯对象，Object.assign 仍可用。
    return createSolvableGame(createDeck())
  } catch (err) {
    // 最外层 L3 兜底：构造/求解器任何异常都不得阻塞首屏，退回旧版纯随机装配。
    console.warn('[deal] createGame fallback to legacy shuffle', err)
    const cards = shuffle(createDeck())
    const pyramid: Card[][] = []
    let k = 0
    for (let r = 0; r < 7; r++) {
      const row: Card[] = []
      for (let c = 0; c <= r; c++) {
        const card = cards[k++]
        card.zone = 'pyramid'
        card.r = r
        card.c = c
        row.push(card)
      }
      pyramid.push(row)
    }
    const stock = cards.slice(k)
    for (const c of stock) c.zone = 'stock'
    return {
      cards, pyramid, stock,
      waste: [], selectedId: null, steps: 0,
      startedAt: Date.now(), finished: false, busy: false, lastFlipId: null,
    }
  }
}

// 第 r 层第 c 张被下一层（r+1）的 c、c+1 两张压住；两张都消除后才完全露出。
// 最底层 r=6 恒露出。
export function isExposed(s: GameState, card: Card): boolean {
  // 已消除的牌、非金字塔牌一律不算「露出」。
  if (card.zone !== 'pyramid' || card.removed) return false
  if (card.r >= 6) return true
  const row = s.pyramid[card.r + 1]
  // 结构必须完整：第 r+1 行应有 r+2 张牌，缺失时保守判为被压住。
  if (!row || row.length !== card.r + 2) return false
  const a = row[card.c]
  const b = row[card.c + 1]
  // 必须两张压住它的牌都存在且都已消除，才算完全露出；
  // 缺一张、或任何一张还在，都不得参与选中与组合。
  return Boolean(a && b && a.removed && b.removed)
}

export function isPlayable(s: GameState, card: Card): boolean {
  if (card.removed) return false
  if (card.zone === 'waste') return s.waste.indexOf(card) !== -1
  if (card.zone === 'pyramid') return isExposed(s, card)
  return false
}

export function isPair(a: Card, b: Card): boolean {
  return a.id !== b.id && a.value + b.value === 13
}

export function playableCards(s: GameState): Card[] {
  return s.cards.filter((c) => isPlayable(s, c))
}

export function hasAvailableMove(s: GameState): boolean {
  const list = playableCards(s)
  if (list.some((c) => c.value === 13)) return true
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[i].value + list[j].value === 13) return true
    }
  }
  return false
}

export function remainingCount(s: GameState): number {
  return s.cards.reduce((n, c) => n + (c.removed ? 0 : 1), 0)
}

function cardById(s: GameState, id: number): Card | undefined {
  return s.cards.find((c) => c.id === id)
}

function removeCards(s: GameState, list: Card[]): void {
  for (const c of list) c.removed = true
  s.waste = s.waste.filter((c) => !c.removed)
  s.selectedId = null
  s.steps += 1
}

// 点击一张牌：选中 / 取消 / 配对消除 / K 单消 / 错误抖动 / 忽略。
export function selectOrMatch(s: GameState, card: Card): SelectResult {
  if (s.finished || s.busy || card.removed) return 'ignored'
  // 被其它牌压住的金字塔牌：明确返回 blocked，交给 UI 给「不能选」的反馈，
  // 而不是静默忽略让人误以为规则被改了。
  if (!isPlayable(s, card)) return 'blocked'

  // 关键顺序：K 单消规则必须排在「完全露出」判定之后。
  // 被其它牌压住的 K（哪怕点数就是 13）同样不可选中、不可单点消除。
  // K 单点直接消除；刻意保留已有的选中牌，不打断玩家节奏。
  if (card.value === 13) {
    const prev = s.selectedId === null ? undefined : cardById(s, s.selectedId)
    removeCards(s, [card])
    s.selectedId = prev && isPlayable(s, prev) ? prev.id : null
    return 'removed'
  }
  if (s.selectedId === null) {
    s.selectedId = card.id
    return 'selected'
  }
  if (s.selectedId === card.id) {
    s.selectedId = null
    return 'deselected'
  }
  const prev = cardById(s, s.selectedId)
  // 防御：任何情况下都不得与「不可点」的牌配对，杜绝暗牌被误消除。
  if (prev && isPlayable(s, prev) && isPair(prev, card)) {
    removeCards(s, [prev, card])
    return 'removed'
  }
  s.selectedId = null
  return 'shake'
}

// 一次只翻一张，翻出即明牌并常驻明牌区。手牌翻完后不再产生新牌、不回收重翻。
export function drawOne(s: GameState): boolean {
  if (s.finished || s.busy || s.stock.length === 0) return false
  const card = s.stock.shift()!
  card.zone = 'waste'
  s.waste.push(card)
  s.lastFlipId = card.id
  return true
}

export function evaluate(s: GameState): GameOutcome {
  if (remainingCount(s) === 0) return 'cleared'
  // 手牌已翻完且再无任何可用配对或 K，即为纸牌阵固有的死局。
  if (s.stock.length === 0 && !hasAvailableMove(s)) return 'stuck'
  return 'playing'
}

export function elapsedSeconds(s: GameState): number {
  return Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000))
}
