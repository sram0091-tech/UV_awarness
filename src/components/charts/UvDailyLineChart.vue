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
    labels: rows.map((r) => String(r.label ?? r.hour ?? '')),
    datasets: [
      {
        label: 'Hourly Mean UV',
        data: rows.map((r) => Number(r.hourlyMeanUv) ?? Number(r.hourly_mean_uv) ?? 0),
        borderColor: barColors.hourlyMeanUv,
        backgroundColor: 'transparent',
        tension: 0.2,
        fill: false
      },
      {
        label: 'Hourly Max UV',
        data: rows.map((r) => Number(r.hourlyMaxUv) ?? Number(r.hourly_max_uv) ?? 0),
        borderColor: barColors.hourlyMaxUv,
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
