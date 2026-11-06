<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import PyramidBoard from './components/PyramidBoard.vue'
import ResultModal from './components/ResultModal.vue'
import InfoModal from './components/InfoModal.vue'
import TopicModal from './components/TopicModal.vue'
import FunDictionary from './components/FunDictionary.vue'
import {
  createGame, drawOne, elapsedSeconds, evaluate, remainingCount, selectOrMatch,
  type Card, type GameOutcome,
} from './game'
import { getHint } from './hint.ts'
import { DISCLAIMER, replayLine, topicByKey } from './readings'
import { lookupReading } from './corpus'

type Phase = 'start' | 'playing' | 'finished'
type ModalKey = 'none' | 'rules' | 'topic' | 'more' | 'result'

// 首屏直入：打开即为 playing，默认话题 mood；弹窗单一枚举互斥。
const phase = ref<Phase>('playing')
const topicKey = ref('mood')
const question = ref('')
const topicLabel = computed(() => topicByKey(topicKey.value).label)
const modal = ref<ModalKey>('none')

// 单一状态源：子组件直接读写这个 reactive 对象的字段，HUD 自动同步。
const game = reactive(createGame())

const outcome = ref<GameOutcome | null>(null)
const finalElapsed = ref<number | null>(null)

const vanishIds = ref<number[]>([])
const shakeIds = ref<number[]>([])
const flipId = ref<number | null>(null)

const hintIds = ref<number[]>([])
const hintStock = ref(false)
const hintText = ref('')

// 每局一次、不限天数：优先查预生成语料，缺条目才回落本地枚举组合。
const readingText = ref('')
const readingConsumed = ref(false)
const readingSource = ref<'corpus' | 'fallback'>('corpus')
const readingCardTitle = ref('')

const now = ref(Date.now())
let clock: number | null = null
let toastTimer: number | null = null
let hintTimer: number | null = null
const toastText = ref('')
const toastShow = ref(false)

const remaining = computed(() => remainingCount(game))
const elapsed = computed(() => {
  if (finalElapsed.value !== null) return finalElapsed.value
  return Math.max(0, Math.floor((now.value - game.startedAt) / 1000))
})

onMounted(() => {
  clock = window.setInterval(() => { now.value = Date.now() }, 1000)
  // P1-2（可选）：记住上次选择的话题，存储异常静默回落 mood。
  try {
    const saved = window.localStorage.getItem('pyramid-topic')
    if (saved && topicByKey(saved).key === saved) topicKey.value = saved
  } catch {
    // 隐私模式 / 禁用存储：忽略，保持默认 mood。
  }
})
onBeforeUnmount(() => {
  if (clock !== null) window.clearInterval(clock)
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  if (hintTimer !== null) window.clearTimeout(hintTimer)
})

function showToast(msg: string): void {
  toastText.value = msg
  toastShow.value = true
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastShow.value = false }, 2200)
}

function clearHint(): void {
  hintIds.value = []
  hintStock.value = false
  hintText.value = ''
  if (hintTimer !== null) {
    window.clearTimeout(hintTimer)
    hintTimer = null
  }
}

function freshGame(): void {
  Object.assign(game, createGame())
  phase.value = 'playing'
  outcome.value = null
  modal.value = 'none'
  finalElapsed.value = null
  readingText.value = ''
  readingConsumed.value = false
  readingSource.value = 'corpus'
  readingCardTitle.value = ''
  vanishIds.value = []
  shakeIds.value = []
  flipId.value = null
  clearHint()
  showToast('新的一副牌已经摆好')
}

function openModal(key: ModalKey): void {
  clearHint()
  modal.value = key
}

function closeModal(): void {
  // 结果弹窗不可由遮罩 / Esc 关闭，只能「再摆一局」。
  if (modal.value === 'result') return
  modal.value = 'none'
}

function checkOutcome(): void {
  if (phase.value !== 'playing' || game.finished) return
  const o = evaluate(game)
  if (o === 'playing') return
  game.finished = true
  finalElapsed.value = elapsedSeconds(game)
  outcome.value = o
  phase.value = 'finished'
  readingText.value = ''
  readingConsumed.value = false
  modal.value = 'result'
}

function onHintClick(): void {
  if (game.finished || game.busy || phase.value !== 'playing') return
  clearHint()
  const r = getHint(game)
  hintIds.value = r.move ? r.move.cards.slice() : []
  hintStock.value = r.tier === 6
  hintText.value = r.text
  if (hintTimer !== null) window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => clearHint(), 8000)
}

function onCardClick(card: Card): void {
  if (game.finished || game.busy) return
  const before = new Set(game.cards.filter((c) => c.removed).map((c) => c.id))
  const prevId = game.selectedId
  const res = selectOrMatch(game, card)
  if (res === 'ignored') return
  clearHint()

  if (res === 'removed') {
    const justRemoved = game.cards
      .filter((c) => c.removed && !before.has(c.id))
      .map((c) => c.id)
    vanishIds.value = justRemoved
    game.busy = true
    // 淡出动画结束再解锁并判定胜负，避免动画期连点造成竞态。
    window.setTimeout(() => {
      vanishIds.value = []
      game.busy = false
      checkOutcome()
    }, 380)
  } else if (res === 'shake') {
    shakeIds.value = prevId === null ? [card.id] : [prevId, card.id]
    window.setTimeout(() => { shakeIds.value = [] }, 340)
  } else if (res === 'blocked') {
    // 被压住的牌：明确告诉玩家「现在还不能选」，绝不参与任何组合。
    shakeIds.value = [card.id]
    window.setTimeout(() => { shakeIds.value = [] }, 340)
    showToast('这张牌还被压着，先消掉压住它的两张牌')
  }
}

function onStockClick(): void {
  if (game.finished || game.busy) return
  if (game.stock.length === 0) {
    showToast('手牌已翻完')
    return
  }
  clearHint()
  if (drawOne(game)) {
    flipId.value = game.lastFlipId
    const id = game.lastFlipId
    window.setTimeout(() => {
      if (flipId.value === id) flipId.value = null
    }, 420)
    checkOutcome()
  }
}

function onReading(): void {
  if (readingConsumed.value || !outcome.value) return
  // 用本局真实牌面算出结果卡编号，去预生成语料里取整段文案；取不到才走兜底。
  const leftValues = game.cards.filter((c) => !c.removed).map((c) => c.value)
  const r = lookupReading({
    topicKey: topicKey.value,
    kind: outcome.value,
    remaining: remaining.value,
    steps: game.steps,
    remainingValues: leftValues,
    elapsed: elapsed.value,
  })
  readingText.value = r.text
  readingSource.value = r.source
  readingCardTitle.value = r.cardTitle
  readingConsumed.value = true
}

// Q3：应用话题只更新标签与内容，不重置牌局；换牌统一用「重新开局」。
function applyTopic(p: { topicKey: string; question: string }): void {
  topicKey.value = p.topicKey
  question.value = p.question
  try {
    window.localStorage.setItem('pyramid-topic', p.topicKey)
  } catch {
    // 存储不可用：忽略，本局标签仍生效。
  }
  modal.value = 'none'
}

const replayQuote = computed(() => replayLine(remaining.value, game.steps))
const stats = computed(() => ({
  remaining: remaining.value,
  steps: game.steps,
  elapsed: elapsed.value,
}))

const rules = [
  '使用标准 52 张牌（无大小王）。A=1，2～10 为面值，J=11，Q=12，K=13。',
  '两张牌点数之和等于 13 即可消除；K 本身就是 13，单点直接消除。',
  '金字塔共 7 层 28 张（第 1 层 1 张……第 7 层 7 张），其余 24 张为手牌堆。',
  '一张牌被下一层相邻两张压住，只有这两张都消除后才算完全露出；只有完全露出的牌可选中。',
  '手牌一次翻一张，翻出即明牌。所有已翻出的明牌逐张摊开、全部可点、全部可以互相配对。',
  '手牌翻完后不再产生新牌，也不回收重翻；此后只用已摊开的明牌继续消除。',
  '点一张选中，再点另一张：和为 13 则一起消除；选错会轻微抖动，不消除。',
  '52 张全部消除即通关。若手牌已翻完且再无可消除组合，会弹出「这局不算，重摆一局」。',
  '每局结束可看一次趣味解答：按本局牌面算出结果卡，从本地预生成语料中取出该话题的完整解答；取不到才用本地短句组合兜底。全程不联网、不调用大模型，不含任何预测或建议。游戏本身不限次数。',
]
</script>

<template>
  <div class="wrap">
    <div class="topbar">
      <div class="topbar-line">
        <h1>金字塔配对 · 休闲消牌</h1>
        <div class="actions">
          <button class="btn" @click="openModal('rules')">规则</button>
          <button class="btn" @click="openModal('topic')">话题</button>
          <button class="btn" @click="openModal('more')">更多</button>
        </div>
      </div>
      <div class="hud-line">
        <div class="hud">
          <span class="hud-topic" role="button" tabindex="0" @click="openModal('topic')">话题 <b>{{ topicLabel }}</b></span>
          <span>剩余 <b>{{ remaining }}</b> 张</span>
          <span>消除 <b>{{ game.steps }}</b> 次</span>
          <span>用时 <b>{{ elapsed }}</b> 秒</span>
        </div>
        <div class="hud-actions">
          <button class="btn" @click="onHintClick">提示</button>
          <button class="btn" @click="freshGame">重新开局</button>
        </div>
      </div>
    </div>

    <PyramidBoard
      :game="game"
      :vanish-ids="vanishIds"
      :shake-ids="shakeIds"
      :flip-id="flipId"
      :hint-ids="hintIds"
      :hint-stock="hintStock"
      :hint-text="hintText"
      @card-click="onCardClick"
      @stock-click="onStockClick"
    />

    <ResultModal
      v-if="modal === 'result' && outcome"
      :outcome="outcome"
      :stats="stats"
      :topic-label="topicLabel"
      :replay-quote="replayQuote"
      :reading-text="readingText"
      :reading-consumed="readingConsumed"
      :reading-source="readingSource"
      :card-title="readingCardTitle"
      :disclaimer="DISCLAIMER"
      @restart="freshGame"
      @reading="onReading"
    />

    <InfoModal
      v-if="modal === 'rules'"
      title="规则说明"
      subtitle="纯消牌小游戏，规则只有加法。"
      @close="closeModal"
    >
      <ol class="rules-list">
        <li v-for="(r, i) in rules" :key="i">{{ r }}</li>
      </ol>
    </InfoModal>

    <InfoModal
      v-if="modal === 'topic'"
      title="话题设置"
      subtitle="只影响本局话题标签，不改变玩法，也不重置当前牌局。"
      :footer="false"
      @close="closeModal"
    >
      <TopicModal
        :topic-key="topicKey"
        :question="question"
        @apply="applyTopic"
        @close="closeModal"
      />
    </InfoModal>

    <InfoModal
      v-if="modal === 'more'"
      title="更多"
      subtitle="民间趣味说法与免责说明"
      @close="closeModal"
    >
      <FunDictionary />
      <div class="modal-section" style="margin-top: 14px; margin-bottom: 0">
        <div class="dict-note" style="margin-top: 0">{{ DISCLAIMER }}</div>
      </div>
    </InfoModal>

    <div class="toast" :class="{ show: toastShow }">{{ toastText }}</div>
  </div>
</template>
