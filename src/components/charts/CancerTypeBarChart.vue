<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { defaultOptions, barColors } from './ChartDefaults.js'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const chartData = computed(() => {
  const rows = Array.isArray(props.data) ? props.data : []
  if (rows.length === 0) return null
  return {
    labels: rows.map((r) => (r.cancerType ?? r.cancer_type ?? '').toString().slice(0, 18)),
    datasets: [
      {
        label: 'rate2001',
        data: rows.map((r) => Number(r.rate2001) || 0),
        backgroundColor: barColors.rate2001
      },
      {
        label: 'rate2023',
        data: rows.map((r) => Number(r.rate2023) || 0),
        backgroundColor: barColors.rate2023
      }
    ]
  }
})

const options = computed(() => ({
  ...defaultOptions,
  plugins: {
    ...defaultOptions.plugins,
    legend: { ...defaultOptions.plugins.legend, position: 'top' }
  }
}))
</script>

<template>
  <div v-if="!chartData" class="chart-empty">No data available</div>
  <div v-else class="chart-container">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
