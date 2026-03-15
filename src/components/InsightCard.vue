<script setup>
defineProps({
  title: { type: String, default: 'Live Insights' },
  content: { type: String, default: '' }
})
</script>

<template>
  <div class="insights-card">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>
