<script setup lang="ts">
import { FUN_RANKS, FUN_SUITS, DICT_DISCLAIMER } from '../readings'
</script>

<template>
  <div>
    <p class="modal-section">
      下面是最早那版国内小朋友口口相传的简易说法，版本很多，这里只作静态的休闲阅读。
    </p>

    <p class="field-label">点数</p>
    <div class="dict-grid">
      <div v-for="r in FUN_RANKS" :key="r.rank"><b>{{ r.rank }}</b>{{ r.text }}</div>
    </div>

    <p class="field-label" style="margin-top: 14px">花色</p>
    <div class="dict-grid">
      <div v-for="s in FUN_SUITS" :key="s.suit"><b>{{ s.suit }}</b>{{ s.text }}</div>
    </div>

    <div class="dict-note">{{ DICT_DISCLAIMER }}</div>
  </div>
</template>
