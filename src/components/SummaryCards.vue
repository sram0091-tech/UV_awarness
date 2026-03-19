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
    :style="columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}"
  >
    <div v-for="(item, i) in items" :key="i" class="summary-card">
      <div class="summary-top">
        <span class="summary-label">{{ item.label }}</span>
      </div>

      <div class="summary-value">
        {{ item.value }}
      </div>
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
  background: linear-gradient(180deg, rgba(24,24,29,0.95), rgba(18,18,22,0.95));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 14px 32px rgba(0,0,0,0.22);
  transition: 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 88px;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.14);
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-label {
  font-size: 12px;
  color: #9ca3af;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-value {
  margin-top: 8px;
  font-size: clamp(1.3rem, 2.2vw, 1.8rem);
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.1;
  letter-spacing: -0.02em;
  word-break: break-word;
}
</style>