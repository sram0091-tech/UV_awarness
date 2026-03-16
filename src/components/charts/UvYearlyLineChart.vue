<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { defaultOptions, barColors } from './ChartDefaults.js'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

function cleanNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const chartData = computed(() => {
  const rows = Array.isArray(props.data) ? props.data : []
  if (rows.length === 0) return null

  return {
    labels: rows.map((r, i) => (r.date ? String(r.date).slice(5) : r.label ?? String(i + 1))),
    datasets: [
      {
        label: 'Average UV',
        data: rows.map((r) => cleanNumber(r.hourlyMeanUv ?? r.hourly_mean_uv)),
        borderColor: barColors.hourlyMeanUv,
        backgroundColor: 'transparent',
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointHitRadius: 14,
        borderWidth: 3,
        tension: 0.35,
        fill: false
      },
      {
        label: 'Maximum UV',
        data: rows.map((r) => cleanNumber(r.hourlyMaxUv ?? r.hourly_max_uv)),
        borderColor: barColors.hourlyMaxUv,
        backgroundColor: 'transparent',
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointHitRadius: 14,
        borderWidth: 3,
        tension: 0.35,
        fill: false
      }
    ]
  }
})

const options = computed(() => ({
  ...defaultOptions,
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  onHover: (event, activeElements, chart) => {
    const target = chart?.canvas
    if (target) {
      target.style.cursor = activeElements?.length ? 'pointer' : 'default'
    }
  },
  plugins: {
    ...defaultOptions.plugins,
    legend: {
      ...defaultOptions.plugins.legend,
      position: 'top',
      labels: {
        color: '#d1d5db',
        boxWidth: 26,
        padding: 14,
        usePointStyle: false
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#fff',
      bodyColor: '#e5e7eb',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        title(items) {
          return items?.[0]?.label ?? ''
        },
        label(context) {
          return `${context.dataset.label}: ${cleanNumber(context.raw).toFixed(2)}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#cbd5e1',
        maxRotation: 0,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
        padding: 8
      },
      grid: {
        color: 'rgba(255,255,255,0.08)'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#cbd5e1',
        precision: 0,
        padding: 8
      },
      grid: {
        color: 'rgba(255,255,255,0.08)'
      }
    }
  }
}))
</script>

<template>
  <div v-if="!chartData" class="chart-empty chart-tall">No data available</div>
  <div v-else class="chart-container chart-tall uv-chart-shell">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.uv-chart-shell {
  height: 360px;
}
</style>