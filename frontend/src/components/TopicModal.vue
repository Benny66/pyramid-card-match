<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TOPICS, TOPIC_GROUPS, checkQuestion, topicByKey } from '../readings'

const props = defineProps<{
  topicKey: string
  question: string
}>()

const emit = defineEmits<{
  (e: 'apply', payload: { topicKey: string; question: string }): void
  (e: 'close'): void
}>()

const selectedKey = ref(props.topicKey)
const question = ref(props.question)
const error = ref('')

watch(() => props.topicKey, (v) => { selectedKey.value = v })
watch(() => props.question, (v) => { question.value = v })

const hint = computed(() => topicByKey(selectedKey.value).hint)
const groups = TOPIC_GROUPS.map((label) => ({
  label,
  items: TOPICS.filter((t) => t.group === label),
}))
const questionLength = computed(() => Array.from(question.value.trim()).length)

function apply(): void {
  const check = checkQuestion(question.value)
  if (!check.ok) {
    error.value = check.message
    return
  }
  error.value = ''
  emit('apply', { topicKey: selectedKey.value, question: check.text })
}
</script>

<template>
  <div>
    <label class="field-label">① 选一个占卜类型（共 {{ TOPICS.length }} 种，都是中性话题标签）</label>
    <div v-for="g in groups" :key="g.label" class="chip-group">
      <div class="chip-group-label">{{ g.label }}</div>
      <div class="chips">
        <button
          v-for="t in g.items"
          :key="t.key"
          class="chip"
          :class="{ active: selectedKey === t.key }"
          @click="selectedKey = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </div>
    <span class="chip-hint">{{ hint }}</span>

    <label class="field-label" for="q">② 占卜内容（选填，{{ questionLength }}/200 字）</label>
    <textarea
      id="q"
      v-model="question"
      class="q-input"
      maxlength="220"
      placeholder="随手写点什么，也可以留空……"
    ></textarea>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="modal-actions">
      <button class="btn btn-primary" @click="apply">应用话题</button>
      <button class="btn" @click="emit('close')">取消</button>
    </div>
  </div>
</template>
