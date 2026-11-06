<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  dismissible?: boolean
  footer?: boolean
}>(), {
  subtitle: '',
  dismissible: true,
  footer: true,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

function onKey(e: KeyboardEvent): void {
  if (props.dismissible && e.key === 'Escape') emit('close')
}

function onMask(): void {
  if (props.dismissible) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal-mask" @click.self="onMask">
    <div class="modal" role="dialog" aria-modal="true">
      <h2>{{ title }}</h2>
      <p v-if="subtitle" class="sub">{{ subtitle }}</p>
      <slot />
      <div v-if="footer" class="modal-actions">
        <button class="btn btn-primary" @click="emit('close')">知道了</button>
      </div>
    </div>
  </div>
</template>
