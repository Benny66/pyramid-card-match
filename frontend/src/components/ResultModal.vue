<script setup lang="ts">
import ReadingCard from './ReadingCard.vue'

defineProps<{
  outcome: 'cleared' | 'stuck'
  stats: { remaining: number; steps: number; elapsed: number }
  topicLabel: string
  replayQuote: string
  readingText: string
  readingConsumed: boolean
  readingSource: 'corpus' | 'fallback'
  cardTitle: string
  disclaimer: string
}>()

const emit = defineEmits<{
  (e: 'restart'): void
  (e: 'reading'): void
}>()
</script>

<template>
  <div class="modal-mask">
    <div class="modal" role="dialog" aria-modal="true">
      <h2>{{ outcome === 'cleared' ? '恭喜通关' : '这局不算，重摆一局' }}</h2>
      <p class="sub">
        {{ outcome === 'cleared'
          ? '52 张牌已全部消除，这一局完整收尾。'
          : '牌没收完也没关系，本来就只是消磨时间的小游戏。' }}
      </p>

      <div v-if="outcome === 'stuck'" class="replay-quote">{{ replayQuote }}</div>

      <div class="stat-line">
        本局话题：{{ topicLabel }} ｜ 消除 {{ stats.steps }} 次 ｜ 剩余 {{ stats.remaining }} 张 ｜ 用时 {{ stats.elapsed }} 秒
      </div>

      <div v-if="readingText" class="reading-meta">
        <span class="reading-tag" :class="{ fallback: readingSource === 'fallback' }">
          {{ readingSource === 'corpus' ? '结果卡' : '本地组合' }}
        </span>
        <span>{{ cardTitle }}</span>
      </div>
      <ReadingCard v-if="readingText" :text="readingText" :disclaimer="disclaimer" />

      <div class="modal-actions">
        <button class="btn btn-primary" @click="emit('restart')">再摆一局</button>
        <button class="btn" :disabled="readingConsumed" @click="emit('reading')">
          {{ readingConsumed ? '本局解答已看过' : '看看趣味解答' }}
        </button>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0; line-height: 1.6">
        解答来自本地预生成的结果语料，按本局结果卡与话题查表取得；缺条目时才用本地短句组合兜底。不联网、不调用大模型，每局可看一次，游戏不限次数。
      </p>
      <p class="dict-note" style="font-size: 12px; margin-top: 10px">
        关于趣味解答：每局结束可看一次，按本局牌面查本地结果卡；不联网、不调用大模型，也不含预测或建议。
      </p>
    </div>
  </div>
</template>
