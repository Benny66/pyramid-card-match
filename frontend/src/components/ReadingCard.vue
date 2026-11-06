<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  text: string
  disclaimer: string
}>()

const shown = ref('')
let timer: number | null = null

function stop() {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

function type(text: string) {
  stop()
  shown.value = ''
  const chars = Array.from(text)
  let i = 0
  timer = window.setInterval(() => {
    if (i >= chars.length) {
      stop()
      return
    }
    shown.value += chars.slice(i, i + 3).join('')
    i += 3
  }, 16)
}

watch(() => props.text, (v) => { if (v) type(v) }, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <div>
    <div class="reading-box">
      {{ shown }}<span v-if="shown.length < Array.from(text).length" class="cursor">&nbsp;</span>
    </div>
    <div class="reading-disclaimer">{{ disclaimer }}</div>
  </div>
</template>
