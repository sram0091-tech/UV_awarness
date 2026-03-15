<script setup>
import { ref, onMounted } from 'vue'
import SummaryCards from '../components/SummaryCards.vue'
import FilterBar from '../components/FilterBar.vue'
import InsightCard from '../components/InsightCard.vue'
import CancerStateBarChart from '../components/charts/CancerStateBarChart.vue'
import CancerTypeBarChart from '../components/charts/CancerTypeBarChart.vue'
import CancerTrendLineChart from '../components/charts/CancerTrendLineChart.vue'
import * as cancerApi from '../services/cancerApi.js'

const status = ref('Waiting to load cancer data…')
const statusOk = ref(true)
const filters = ref({ years: [], sexes: [], states: [], cancerTypes: [] })
const year = ref('')
const sex = ref('')
const state = ref('')
const cancerType = ref('')
const stateRates = ref([])
const typeRates = ref([])
const trend = ref([])
const summary = ref(null)

function numberOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : String(value)
}

function percentOrDash(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : String(value)
}

const summaryItems = ref([])

function setStatus(text, ok) {
  status.value = text
  statusOk.value = ok
}

function setSummaryItems() {
  const s = summary.value
  if (!s) {
    summaryItems.value = [
      { label: 'Average Rate 2001', value: '—' },
      { label: 'Average Rate 2023', value: '—' },
      { label: 'Highest Rate State', value: '—' },
      { label: 'Highest Rate 2023', value: '—' },
      { label: 'Rate Change %', value: '—' }
    ]
    return
  }
  summaryItems.value = [
    { label: 'Average Rate 2001', value: numberOrDash(s.averageRate2001) },
    { label: 'Average Rate 2023', value: numberOrDash(s.averageRate2023) },
    { label: 'Highest Rate State', value: s.highestRateState ?? '—' },
    { label: 'Highest Rate 2023', value: numberOrDash(s.highestRate2023) },
    { label: 'Rate Change %', value: percentOrDash(s.rateChangePercent) }
  ]
}

const insightText = ref(
  'Once the API responds, this card will describe the main rate-based result using the returned summary and chart values.'
)

async function loadFilters() {
  const data = await cancerApi.getFilters()
  filters.value = {
    years: data.years || [],
    sexes: data.sexes || [],
    states: (data.states || []).filter(s => s !== 'Australia'),
    cancerTypes: data.cancerTypes || data.cancer_types || []
  }
}

async function loadDashboard() {
  setStatus('Loading cancer endpoints…', true)
  try {
    if (!filters.value.years?.length) await loadFilters()
    const params = {
      year: year.value || undefined,
      sex: sex.value || undefined,
      state: state.value || undefined,
      cancer_type: cancerType.value || undefined
    }
    const [stateRatesRes, typeRatesRes, trendRes, summaryRes] = await Promise.all([
      cancerApi.getRateByState(params),
      cancerApi.getRateByCancerType(params),
      cancerApi.getTrend(params),
      cancerApi.getSummary(params)
    ])
    
    stateRates.value = Array.isArray(stateRatesRes)
  ? stateRatesRes.filter(row => row.state !== 'Australia').sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))
  : []
    typeRates.value = Array.isArray(typeRatesRes) ? typeRatesRes : []
    trend.value = Array.isArray(trendRes) ? trendRes : []
    summary.value = summaryRes
    setSummaryItems()
    const top = stateRates.value[0]
    const s = summary.value
    insightText.value = top
      ? `The current filter selection shows ${top.state} as the strongest visible state-level result in the state chart, while the summary endpoint reports ${s?.highestRateState || 'the leading state'} with a highest 2023 rate of ${numberOrDash(s?.highestRate2023)}.`
      : 'No cancer records were returned for the current filter combination.'
    setStatus('Cancer endpoints loaded successfully.', true)
  } catch (err) {
    setStatus(`Cancer API error: ${err.message}`, false)
  }
}

onMounted(() => {
  loadDashboard()
})

function onApply() {
  loadDashboard()
}
</script>

<template>
  <div class="page-content">
    <div class="sub-nav">
      <router-link to="/cancer" class="sub-nav-link active">Cancer Rates</router-link>
      <router-link to="/uv" class="sub-nav-link">UV Dashboard</router-link>
    </div>
    <div class="dashboard-shell">
      <div class="section-heading">
        <span class="section-number">01</span>
        <span class="section-dot"></span>
        Skin Cancer Rate Dashboard
      </div>
      <p class="section-desc">
        This page is connected to your back-end cancer APIs: filters, rate-by-state, rate-by-cancer-type, trend, and summary.
      </p>

      <div class="status-bar">
        <div :class="['status', statusOk ? 'ok' : 'err']">{{ status }}</div>
      </div>

      <div class="panel">
        <FilterBar @apply="onApply">
          <div class="filter-group">
            <label for="cancerYear">Year</label>
            <select id="cancerYear" v-model="year">
              <option value="">All</option>
              <option v-for="y in filters.years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="cancerSex">Sex</label>
            <select id="cancerSex" v-model="sex">
              <option value="">All</option>
              <option v-for="s in filters.sexes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="cancerState">State</label>
            <select id="cancerState" v-model="state">
              <option value="">All</option>
              <option v-for="st in filters.states" :key="st" :value="st">{{ st }}</option>
            </select>
          </div>
        </FilterBar>

        <SummaryCards :items="summaryItems" />

        <div class="chart-grid-2">
          <div class="chart-card">
            <div class="chart-title">Rate by State</div>
            <CancerStateBarChart :data="stateRates" />
          </div>
          <div class="chart-card">
            <div class="chart-title">Rate by Cancer Type</div>
            <CancerTypeBarChart :data="typeRates" />
          </div>
        </div>

        <div class="chart-card" style="margin-bottom: 18px">
          <div class="chart-title">Yearly Trend</div>
          <CancerTrendLineChart :data="trend" />
        </div>
      </div>

      <div class="dashboard-grid" style="margin-top: 18px">
        <div class="table-card">
          <div class="chart-title">State Data Table</div>
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Rate 2001</th>
                <th>Rate 2023</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in stateRates" :key="i">
                <td>{{ row.state ?? '' }}</td>
                <td>{{ numberOrDash(row.rate2001) }}</td>
                <td>{{ numberOrDash(row.rate2023) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <InsightCard title="Live Insights" :content="insightText" />
        </div>
      </div>
    </div>
  </div>
</template>
