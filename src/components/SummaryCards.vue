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
  <div
    class="summary-grid"
    :style="columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}"
  >
    <div v-for="(item, i) in items" :key="i" class="summary-card">
      <div class="summary-label">{{ item.label }}</div>
      <div class="summary-value">{{ item.value }}</div>
    </div>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  gap: 14px;
}

.summary-card {
  padding: 18px 18px 16px;
  border-radius: 18px;
  background: rgba(12, 16, 28, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 112px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: #cbd5e1;
  line-height: 1.4;
}

.summary-value {
  margin-top: 12px;
  font-size: clamp(1.6rem, 2vw, 2.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
  word-break: break-word;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr !important;
  }

  .summary-card {
    min-height: 96px;
  }
}
</style>