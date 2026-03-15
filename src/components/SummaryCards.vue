<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  },
  columns: { type: Number, default: 5 }
})
</script>

<template>
  <div class="summary-grid" :style="columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}">
    <div v-for="(item, i) in items" :key="i" class="summary-card">
      <div class="summary-label">{{ item.label }}</div>
      <div class="summary-value">{{ item.value }}</div>
    </div>
  </div>
</template>
