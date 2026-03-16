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

const stateRates = ref([])
const typeRates = ref([])
const trend = ref([])
const summary = ref(null)

const summaryItems = ref([])

const insightText = ref(
  'Select filters to compare state-level rates, cancer type patterns, and the longer-term trend.'
)

function numberOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : String(value)
}

function percentOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(digits = 2)}%` : String(value)
}

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

function buildInsightText() {
  if (!stateRates.value.length && !typeRates.value.length && !trend.value.length) {
    insightText.value = 'No cancer records were returned for the current filter combination.'
    return
  }

  const topState = stateRates.value[0]
  const topType = [...typeRates.value]
    .sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))[0]

  const trendStart = trend.value[0]
  const trendEnd = trend.value[trend.value.length - 1]

  let trendSentence = 'The yearly trend is not available for the current selection.'
  if (trendStart && trendEnd) {
    const startRate = Number(trendStart.rate ?? trendStart.value ?? trendStart.averageRate ?? 0)
    const endRate = Number(trendEnd.rate ?? trendEnd.value ?? trendEnd.averageRate ?? 0)

    if (Number.isFinite(startRate) && Number.isFinite(endRate)) {
      if (endRate > startRate) {
        trendSentence = `Across the available trend series, the rate increases from ${numberOrDash(startRate)} to ${numberOrDash(endRate)}.`
      } else if (endRate < startRate) {
        trendSentence = `Across the available trend series, the rate declines from ${numberOrDash(startRate)} to ${numberOrDash(endRate)}.`
      } else {
        trendSentence = `Across the available trend series, the rate remains stable at around ${numberOrDash(endRate)}.`
      }
    }
  }

  const stateSentence = topState
    ? `${topState.state} currently appears as the strongest state-level result, with a 2023 rate of ${numberOrDash(topState.rate2023)} compared with ${numberOrDash(topState.rate2001)} in 2001.`
    : 'A leading state result is not available for the current selection.'

  const typeSentence = topType
    ? `${topType.cancer_type || topType.cancerType || 'The leading cancer type'} records the highest visible 2023 type-level rate at ${numberOrDash(topType.rate2023)}.`
    : 'A leading cancer type result is not available for the current selection.'

  const summarySentence = summary.value?.highestRateState
    ? `The summary endpoint also identifies ${summary.value.highestRateState} as the highest-rate state in 2023, at ${numberOrDash(summary.value.highestRate2023)}.`
    : 'A summary-level highest-rate state is not available for the current selection.'

  insightText.value = `${stateSentence} ${typeSentence} ${trendSentence} ${summarySentence}`
}

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
      state: state.value || undefined
    }

    const [stateRatesRes, typeRatesRes, trendRes, summaryRes] = await Promise.all([
      cancerApi.getRateByState(params),
      cancerApi.getRateByCancerType(params),
      cancerApi.getTrend(params),
      cancerApi.getSummary(params)
    ])

    stateRates.value = Array.isArray(stateRatesRes)
      ? stateRatesRes
          .filter(row => row.state !== 'Australia')
          .sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))
      : []

    typeRates.value = Array.isArray(typeRatesRes) ? typeRatesRes : []
    trend.value = Array.isArray(trendRes) ? trendRes : []
    summary.value = summaryRes

    setSummaryItems()
    buildInsightText()

    setStatus('Cancer endpoints loaded successfully.', true)
  } catch (err) {
    setStatus(`Cancer API error: ${err.message}`, false)
  }
}

function onApply() {
  loadDashboard()
}

onMounted(() => {
  loadDashboard()
})
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
        Explore state-level cancer rates, cancer-type differences, and year-by-year trend patterns
        using the connected back-end cancer API endpoints.
      </p>

      <div class="status-bar">
        <div :class="['status', statusOk ? 'ok' : 'err']">{{ status }}</div>
      </div>

      <div class="panel panel-spaced">
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

        <div class="chart-grid-2 balanced-grid">
          <div class="chart-card">
            <div class="chart-title">Rate by State</div>
            <p class="chart-subtitle">States are ordered by highest 2023 rate.</p>
            <CancerStateBarChart :data="stateRates" />
          </div>

          <div class="chart-card">
            <div class="chart-title">Rate by Cancer Type</div>
            <p class="chart-subtitle">Compare rate differences across cancer categories.</p>
            <CancerTypeBarChart :data="typeRates" />
          </div>
        </div>

        <div class="chart-card chart-card-lg">
          <div class="chart-title">Yearly Trend</div>
          <p class="chart-subtitle">Track how the selected rate changes across time.</p>
          <CancerTrendLineChart :data="trend" />
        </div>
      </div>

      <div class="dashboard-grid insight-layout">
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

        <div class="insight-column">
          <InsightCard
            title="Live Insights"
            :content="insightText"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-spaced {
  display: grid;
  gap: 20px;
}

.balanced-grid {
  align-items: stretch;
}

.chart-subtitle {
  margin: 6px 0 14px;
  font-size: 0.92rem;
  line-height: 1.45;
  color: #6b7280;
}

.chart-card-lg {
  margin-bottom: 0;
}

.insight-layout {
  margin-top: 20px;
  align-items: start;
}

.insight-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-card table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 900px) {
  .panel-spaced,
  .insight-column {
    gap: 16px;
  }

  .insight-layout {
    margin-top: 16px;
  }
}
</style>