<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { defaultOptions, barColors } from './ChartDefaults.js'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const chartData = computed(() => {
  const rows = Array.isArray(props.data) ? props.data : []
  if (rows.length === 0) return null
  return {
    labels: rows.map((r) => String(r.year ?? '')),
    datasets: [
      {
        label: 'rate2001',
        data: rows.map((r) => Number(r.rate2001) || 0),
        borderColor: barColors.rate2001,
        backgroundColor: 'transparent',
        tension: 0.2,
        fill: false
      },
      {
        label: 'rate2023',
        data: rows.map((r) => Number(r.rate2023) || 0),
        borderColor: barColors.rate2023,
        backgroundColor: 'transparent',
        tension: 0.2,
        fill: false
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
  <div v-if="!chartData" class="chart-empty chart-tall">No data available</div>
  <div v-else class="chart-container chart-tall">
    <Line :data="chartData" :options="options" />
  </div>
</template>
