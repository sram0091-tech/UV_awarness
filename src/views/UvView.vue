<script setup>
import { ref, onMounted } from 'vue'
import SummaryCards from '../components/SummaryCards.vue'
import FilterBar from '../components/FilterBar.vue'
import UvDailyLineChart from '../components/charts/UvDailyLineChart.vue'
import UvYearlyLineChart from '../components/charts/UvYearlyLineChart.vue'
import * as uvApi from '../services/uvApi.js'

const status = ref('Waiting to load UV data…')
const statusOk = ref(true)
const filters = ref({ months: [], seasons: [] })
const date = ref('')
const month = ref('')
const season = ref('')
const dailyData = ref([])
const yearlyData = ref([])
const riskList = ref([])
const summary = ref(null)

function numberOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : String(value)
}

const summaryItems = ref([
  { label: 'Max UV', value: '—' },
  { label: 'Average UV', value: '—' },
  { label: 'Highest Risk', value: '—' },
  { label: 'Peak Hour', value: '—' }
])

const dailyChartRows = ref([])
const yearlyChartRows = ref([])
const tableRows = ref([])

function setStatus(text, ok) {
  status.value = text
  statusOk.value = ok
}

/** Normalize API filter list to array of strings (handles numbers or objects). */
function normalizeFilterList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => (v != null && typeof v === 'object' ? v.value ?? v.label ?? v.name : String(v)))
  }
  if (value != null && typeof value === 'object') {
    return Object.values(value).map(String)
  }
  return []
}

async function loadFilters() {
  const data = await uvApi.getFilters()
  filters.value = {
    months: normalizeFilterList(data.months ?? data.month),
    seasons: normalizeFilterList(data.seasons ?? data.season)
  }
}

async function loadDashboard() {
  setStatus('Loading UV endpoints…', true)
  try {
    const params = {
      date: date.value || undefined,
      month: month.value || undefined,
      season: season.value || undefined
    }
    const [riskRes, summaryRes, dailyRes, yearlyRes] = await Promise.all([
      uvApi.getRiskExplanations(),
      uvApi.getSummary(params),
      uvApi.getDailyLineChart({ date: params.date }).catch(() => []),
      uvApi.getYearlyLineChart({
        month: params.month,
        season: params.season
      }).catch(() => [])
    ])
    riskList.value = Array.isArray(riskRes) ? riskRes : []
    summary.value = summaryRes
    const daily = Array.isArray(dailyRes) ? dailyRes : []
    const yearly = Array.isArray(yearlyRes) ? yearlyRes : []

    summaryItems.value = [
      { label: 'Max UV', value: numberOrDash(summaryRes?.maxUv) },
      { label: 'Average UV', value: numberOrDash(summaryRes?.averageUv) },
      { label: 'Highest Risk', value: summaryRes?.highestRiskCategory ?? '—' },
      { label: 'Peak Hour', value: summaryRes?.peakHour ?? '—' }
    ]

    dailyChartRows.value = daily.map((r) => ({
      label: r.hour,
      hourlyMeanUv: r.hourlyMeanUv ?? r.hourly_mean_uv,
      hourlyMaxUv: r.hourlyMaxUv ?? r.hourly_max_uv
    }))
    yearlyChartRows.value = yearly.slice(0, 30).map((r, i) => ({
      label: r.date ? String(r.date).slice(5) : r.hour ?? i,
      date: r.date,
      hourlyMeanUv: r.hourlyMeanUv ?? r.hourly_mean_uv,
      hourlyMaxUv: r.hourlyMaxUv ?? r.hourly_max_uv
    }))

    const forTable = (daily.length ? daily : yearly).slice(0, 12)
    tableRows.value = forTable.map((row) => ({
      date: row.date ?? '—',
      hour: row.hour ?? '—',
      hourlyMeanUv: numberOrDash(row.hourlyMeanUv ?? row.hourly_mean_uv),
      hourlyMaxUv: numberOrDash(row.hourlyMaxUv ?? row.hourly_max_uv),
      uvCategory: row.uvCategory ?? row.uv_category ?? '—'
    }))

    setStatus('UV endpoints loaded successfully.', true)
  } catch (err) {
    setStatus(`UV API error: ${err.message}`, false)
  }
}

function onApply() {
  loadDashboard()
}

onMounted(async () => {
  try {
    await loadFilters()
  } catch {
    // keep empty months/seasons
  }
  loadDashboard()
})
</script>

<template>
  <div class="page-content">
    <div class="sub-nav">
      <router-link to="/cancer" class="sub-nav-link">Cancer Rates</router-link>
      <router-link to="/uv" class="sub-nav-link active">UV Dashboard</router-link>
    </div>
    <div class="dashboard-shell">
      <div class="section-heading">
        <span class="section-number">02</span>
        <span class="section-dot"></span>
        Melbourne UV Dashboard
      </div>
      <p class="section-desc">
        This page is connected to your UV APIs: filters, yearly-line-chart, daily-line-chart, risk-explanations, and summary.
      </p>

      <div class="status-bar">
        <div :class="['status', statusOk ? 'ok' : 'err']">{{ status }}</div>
        <button type="button" class="apply-btn" @click="onApply">Refresh UV data</button>
      </div>

      <div class="panel">
        <div class="filter-row uv-filter-row">
          <div class="filter-group">
            <label for="uvDate">Single Date</label>
            <input id="uvDate" v-model="date" type="date" />
          </div>
          <div class="filter-group">
            <label for="uvMonth">Month</label>
            <select id="uvMonth" v-model="month">
              <option value="">All</option>
              <option v-for="m in filters.months" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="uvSeason">Season</label>
            <select id="uvSeason" v-model="season">
              <option value="">All</option>
              <option v-for="s in filters.seasons" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <button type="button" class="apply-btn" @click="onApply">Apply</button>
        </div>

        <SummaryCards :items="summaryItems" :columns="4" />

        <div class="uv-layout">
          <div>
            <div class="chart-card" style="margin-bottom: 18px">
              <div class="chart-title">Daily UV Line Chart</div>
              <UvDailyLineChart :data="dailyChartRows" />
            </div>
            <div class="chart-card">
              <div class="chart-title">Yearly / Range UV Line Chart</div>
              <UvYearlyLineChart :data="yearlyChartRows" />
            </div>
          </div>
          <div>
            <div class="risk-card panel" style="margin-bottom: 18px">
              <h3>Risk Explanations</h3>
              <div class="risk-list">
                <div v-for="(item, i) in riskList" :key="i" class="risk-item">
                  <strong>{{ item.uvCategory }} ({{ item.uvNumericCategory }})</strong>
                  <div>{{ item.riskMessage }}</div>
                </div>
              </div>
            </div>
            <div class="table-card">
              <div class="chart-title">UV Data Snapshot</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hour</th>
                    <th>Mean UV</th>
                    <th>Max UV</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in tableRows" :key="i">
                    <td>{{ row.date }}</td>
                    <td>{{ row.hour }}</td>
                    <td>{{ row.hourlyMeanUv }}</td>
                    <td>{{ row.hourlyMaxUv }}</td>
                    <td>{{ row.uvCategory }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
