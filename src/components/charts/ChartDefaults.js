import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const textColor = 'rgba(255, 255, 255, 0.72)'
const gridColor = 'rgba(255, 255, 255, 0.12)'

export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: textColor }
    },
    tooltip: {
      backgroundColor: 'rgba(20, 20, 23, 0.95)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: { color: gridColor },
      ticks: { color: textColor, maxRotation: 0 }
    },
    y: {
      grid: { color: gridColor },
      ticks: { color: textColor }
    }
  }
}

export const barColors = {
  rate2001: '#FBB34F',
  rate2023: '#F26A01',
  hourlyMeanUv: '#BFF5FE',
  hourlyMaxUv: '#F26A01'
}
