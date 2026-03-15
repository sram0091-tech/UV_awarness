<script setup>
defineProps({
  tag: { type: String, default: 'div' }
})

defineEmits(['apply'])
</script>

<template>
  <component :is="tag" class="filter-row">
    <slot />
    <button type="button" class="apply-btn" @click="$emit('apply')">Apply</button>
  </component>
</template>
