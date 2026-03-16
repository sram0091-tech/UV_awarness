<script setup>
defineProps({
  title: { type: String, default: 'UV risk guide' },
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
      <div
        v-for="(item, i) in items"
        :key="i"
        :class="['legend-item', item.active ? 'active' : '']"
      >
        <span class="legend-dot" :style="{ background: item.color }"></span>

        <div class="legend-copy">
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </div>

        <span v-if="item.active" class="active-pill">Current</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legend-card {
  display: grid;
  gap: 14px;
}

.legend-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.legend-list {
  display: grid;
  gap: 12px;
}

.legend-item {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.legend-item:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}

.legend-item.active {
  border-color: rgba(250, 204, 21, 0.35);
  background: rgba(250, 204, 21, 0.08);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-top: 6px;
}

.legend-copy {
  display: grid;
  gap: 6px;
}

.legend-copy strong {
  color: #fff;
  font-size: 1rem;
}

.legend-copy small {
  color: #d1d5db;
  font-size: 0.95rem;
  line-height: 1.5;
}

.active-pill {
  align-self: start;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.18);
  color: #fde68a;
  font-size: 0.8rem;
  font-weight: 700;
}
</style>