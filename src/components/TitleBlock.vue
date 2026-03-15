<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const subtitle = computed(() => route.meta?.subtitle ?? 'Home Page')
</script>

<template>
  <div class="title-block">
    <h1>Australia's <span>Sun Risk</span><br />in Plain Sight</h1>
    <div class="subtitle-main">{{ subtitle }}</div>
    <div class="subtitle-small">
      Connected to your FastAPI endpoints for home, cancer, and UV insights.
    </div>
  </div>
</template>
