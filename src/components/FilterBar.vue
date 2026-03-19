<script setup>
defineProps({
  tag: { type: String, default: 'div' }
})

defineEmits(['apply'])
</script>

<template>
  <component :is="tag" class="filter-row">
    <div class="filter-content">
      <slot />
    </div>

    <div class="filter-actions">
      <button type="button" class="apply-btn" @click="$emit('apply')">
        Apply Filters
      </button>
    </div>
  </component>
</template>

<style scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(24,24,29,0.95), rgba(18,18,22,0.95));
  border: 1px solid rgba(255,255,255,0.08);
}

.filter-content {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}

.filter-actions {
  display: flex;
  align-items: center;
}

.apply-btn {
  padding: 11px 20px;
  border-radius: 999px;
  background: #facc15;
  color: #111;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: 0.2s ease;
  box-shadow: 0 10px 20px rgba(250,204,21,0.15);
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(250,204,21,0.22);
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    width: 100%;
  }

  .apply-btn {
    width: 100%;
    text-align: center;
  }
}
</style>