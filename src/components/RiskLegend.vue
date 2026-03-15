<script setup>
defineProps({
  title: { type: String, default: 'How this page is wired' },
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="legend-card">
    <div class="legend-title">{{ title }}</div>
    <div class="legend-list">
      <div v-for="(item, i) in items" :key="i" class="legend-item">
        <span class="legend-dot" :style="{ background: item.color }"></span>
        <div>
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </div>
      </div>
    </div>
  </div>
</template>
