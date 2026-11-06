<script setup lang="ts">
import { computed } from 'vue'
import type { Card, GameState } from '../game'
import { isPlayable } from '../game'

const props = withDefaults(defineProps<{
  game: GameState
  vanishIds: number[]
  shakeIds: number[]
  flipId: number | null
  hintIds?: number[]
  hintStock?: boolean
  hintText?: string
}>(), {
  hintIds: () => [],
  hintStock: false,
  hintText: '',
})

const emit = defineEmits<{
  (e: 'card-click', card: Card): void
  (e: 'stock-click'): void
}>()

const rows = computed(() => props.game.pyramid)

function cls(card: Card) {
  const playable = isPlayable(props.game, card)
  return {
    red: card.red,
    black: !card.red,
    playable,
    blocked: !card.removed && !playable,
    selected: props.game.selectedId === card.id,
    vanish: props.vanishIds.includes(card.id),
    shake: props.shakeIds.includes(card.id),
    'flip-in': props.flipId === card.id,
    hint: props.hintIds.includes(card.id),
    // 已消除的牌不从 DOM 移除，而是透明占位：
    // 若用 v-if 删节点，flex 行会重新靠拢，金字塔坐标会漂移，
    // 「哪两张牌压住哪张牌」的视觉对应就会和逻辑索引对不上。
    'is-gone': card.removed && !props.vanishIds.includes(card.id),
  }
}
</script>

<template>
  <div v-if="hintText" class="hint-banner">{{ hintText }}</div>

  <div class="panel">
    <p class="panel-title">金字塔 · 7 层</p>
    <div class="board-scroll">
      <div class="pyramid">
        <div v-for="(row, r) in rows" :key="r" class="pyramid-row">
          <template v-for="card in row" :key="card.id">
            <div
              class="card"
              :class="cls(card)"
              @click="emit('card-click', card)"
            >
              <span class="corner tl">
                <span class="rank">{{ card.rank }}</span><span class="suit">{{ card.suit }}</span>
              </span>
              <span class="pip">{{ card.suit }}</span>
              <span class="corner br">
                <span class="rank">{{ card.rank }}</span><span class="suit">{{ card.suit }}</span>
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <div class="panel">
    <p class="panel-title">手牌堆 · 一次翻一张</p>
    <div class="stock-row">
      <button
        class="stock-btn"
        :class="{ 'is-done': game.stock.length === 0, hint: hintStock }"
        :aria-disabled="game.stock.length === 0 ? 'true' : 'false'"
        @click="emit('stock-click')"
      >
        <span>{{ game.stock.length === 0 ? '已翻完' : game.stock.length }}</span>
        <small>{{ game.stock.length === 0 ? '不再翻牌' : '点此翻牌' }}</small>
      </button>
      <div class="stock-note">翻开即明牌，全部摊开、可以互相配对。</div>
    </div>

    <p class="panel-title" style="margin-top: 14px">明牌区 · {{ game.waste.length }} 张</p>
    <div class="waste-row">
      <template v-for="card in game.waste" :key="card.id">
        <div class="card" :class="cls(card)" @click="emit('card-click', card)">
          <span class="corner tl">
            <span class="rank">{{ card.rank }}</span><span class="suit">{{ card.suit }}</span>
          </span>
          <span class="pip">{{ card.suit }}</span>
          <span class="corner br">
            <span class="rank">{{ card.rank }}</span><span class="suit">{{ card.suit }}</span>
          </span>
        </div>
      </template>
      <div v-if="game.waste.length === 0" class="empty-hint">还没有翻开的牌，点上面的手牌堆翻一张。</div>
    </div>
  </div>
</template>

<style scoped>
.stock-note { font-size: 13px; color: #52606d; line-height: 1.7; }
</style>
