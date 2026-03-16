<script setup>
import { ref, computed, onMounted } from 'vue'
import SummaryCards from '../components/SummaryCards.vue'
import FilterBar from '../components/FilterBar.vue'
import InsightCard from '../components/InsightCard.vue'
import CancerStateBarChart from '../components/charts/CancerStateBarChart.vue'
import CancerTypeBarChart from '../components/charts/CancerTypeBarChart.vue'
import CancerTrendLineChart from '../components/charts/CancerTrendLineChart.vue'
import UvDailyLineChart from '../components/charts/UvDailyLineChart.vue'
import UvYearlyLineChart from '../components/charts/UvYearlyLineChart.vue'
import * as cancerApi from '../services/cancerApi.js'
import * as uvApi from '../services/uvApi.js'

const activeTab = ref('uv')

/* -------------------- Shared helpers -------------------- */

function numberOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : String(value)
}

function percentOrDash(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(digits)}%` : String(value)
}

function normalizeFilterList(value) {
  if (Array.isArray(value)) {
    return value.map((v) =>
      v != null && typeof v === 'object'
        ? v.value ?? v.label ?? v.name
        : String(v)
    )
  }
  if (value != null && typeof value === 'object') {
    return Object.values(value).map(String)
  }
  return []
}

/* -------------------- Cancer state -------------------- */

const cancerStatus = ref('Waiting to load cancer data…')
const cancerStatusOk = ref(true)

const cancerFilters = ref({ years: [], sexes: [], states: [], cancerTypes: [] })
const cancerYear = ref('')
const cancerSex = ref('')
const cancerState = ref('')

const stateRates = ref([])
const typeRates = ref([])
const trend = ref([])
const cancerSummary = ref(null)

const cancerSummaryItems = ref([])
const insightText = ref(
  'Select filters to compare state-level rates, cancer type patterns, and the longer-term trend.'
)

function setCancerStatus(text, ok) {
  cancerStatus.value = text
  cancerStatusOk.value = ok
}

function setCancerSummaryItems() {
  const s = cancerSummary.value

  if (!s) {
    cancerSummaryItems.value = [
      { label: 'Average Rate 2001', value: '—' },
      { label: 'Average Rate 2023', value: '—' },
      { label: 'Highest Rate State', value: '—' },
      { label: 'Highest Rate 2023', value: '—' },
      { label: 'Rate Change %', value: '—' }
    ]
    return
  }

  cancerSummaryItems.value = [
    { label: 'Average Rate 2001', value: numberOrDash(s.averageRate2001) },
    { label: 'Average Rate 2023', value: numberOrDash(s.averageRate2023) },
    { label: 'Highest Rate State', value: s.highestRateState ?? '—' },
    { label: 'Highest Rate 2023', value: numberOrDash(s.highestRate2023) },
    { label: 'Rate Change %', value: percentOrDash(s.rateChangePercent) }
  ]
}

function buildCancerInsightText() {
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

  const summarySentence = cancerSummary.value?.highestRateState
    ? `The summary endpoint also identifies ${cancerSummary.value.highestRateState} as the highest-rate state in 2023, at ${numberOrDash(cancerSummary.value.highestRate2023)}.`
    : 'A summary-level highest-rate state is not available for the current selection.'

  insightText.value = `${stateSentence} ${typeSentence} ${trendSentence} ${summarySentence}`
}

async function loadCancerFilters() {
  const data = await cancerApi.getFilters()
  cancerFilters.value = {
    years: data.years || [],
    sexes: data.sexes || [],
    states: (data.states || []).filter((s) => s !== 'Australia'),
    cancerTypes: data.cancerTypes || data.cancer_types || []
  }
}

async function loadCancerDashboard() {
  setCancerStatus('Loading cancer endpoints…', true)

  try {
    if (!cancerFilters.value.years?.length) await loadCancerFilters()

    const params = {
      year: cancerYear.value || undefined,
      sex: cancerSex.value || undefined,
      state: cancerState.value || undefined
    }

    const [stateRatesRes, typeRatesRes, trendRes, summaryRes] = await Promise.all([
      cancerApi.getRateByState(params),
      cancerApi.getRateByCancerType(params),
      cancerApi.getTrend(params),
      cancerApi.getSummary(params)
    ])

    stateRates.value = Array.isArray(stateRatesRes)
      ? stateRatesRes
          .filter((row) => row.state !== 'Australia')
          .sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))
      : []

    typeRates.value = Array.isArray(typeRatesRes) ? typeRatesRes : []
    trend.value = Array.isArray(trendRes) ? trendRes : []
    cancerSummary.value = summaryRes

    setCancerSummaryItems()
    buildCancerInsightText()

    setCancerStatus('Cancer endpoints loaded successfully.', true)
  } catch (err) {
    setCancerStatus(`Cancer API error: ${err.message}`, false)
  }
}

function onCancerApply() {
  loadCancerDashboard()
}

/* -------------------- UV state -------------------- */

const uvStatus = ref('Waiting to load UV data…')
const uvStatusOk = ref(true)
const uvFilters = ref({ months: [], seasons: [] })

const uvDate = ref('')
const uvMonth = ref('')
const uvSeason = ref('')

const riskList = ref([])
const uvSummary = ref(null)

const uvSummaryItems = ref([
  { label: 'Max UV', value: '—' },
  { label: 'Average UV', value: '—' },
  { label: 'Highest Risk', value: '—' },
  { label: 'Peak Hour', value: '—' }
])

const dailyChartRows = ref([])
const yearlyChartRows = ref([])
const tableRows = ref([])

function setUvStatus(text, ok) {
  uvStatus.value = text
  uvStatusOk.value = ok
}

async function loadUvFilters() {
  const data = await uvApi.getFilters()
  uvFilters.value = {
    months: normalizeFilterList(data.months ?? data.month),
    seasons: normalizeFilterList(data.seasons ?? data.season)
  }
}

async function loadUvDashboard() {
  setUvStatus('Loading UV endpoints…', true)

  try {
    const params = {
      date: uvDate.value || undefined,
      month: uvMonth.value || undefined,
      season: uvSeason.value || undefined
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
    uvSummary.value = summaryRes

    const daily = Array.isArray(dailyRes) ? dailyRes : []
    const yearly = Array.isArray(yearlyRes) ? yearlyRes : []

    uvSummaryItems.value = [
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

    setUvStatus('UV endpoints loaded successfully.', true)
  } catch (err) {
    setUvStatus(`UV API error: ${err.message}`, false)
  }
}

function onUvApply() {
  loadUvDashboard()
}

/* -------------------- Lifecycle -------------------- */

const sectionNumber = computed(() => (activeTab.value === 'cancer' ? '01' : '02'))
const sectionTitle = computed(() =>
  activeTab.value === 'cancer' ? 'Skin Cancer Rate Dashboard' : 'Melbourne UV Dashboard'
)
const sectionDesc = computed(() =>
  activeTab.value === 'cancer'
    ? 'Explore state-level cancer rates, cancer-type differences, and year-by-year trend patterns using the connected back-end cancer API endpoints.'
    : 'This page is connected to your UV APIs: filters, yearly-line-chart, daily-line-chart, risk-explanations, and summary.'
)

onMounted(async () => {
  try {
    await Promise.allSettled([loadCancerFilters(), loadUvFilters()])
  } catch {}

  await Promise.allSettled([loadCancerDashboard(), loadUvDashboard()])
})
</script>

<template>
  <div class="page-content">
    <div class="sub-nav">
      <button
        type="button"
        class="sub-nav-link"
        :class="{ active: activeTab === 'cancer' }"
        @click="activeTab = 'cancer'"
      >
        Cancer Dashboard
      </button>

      <button
        type="button"
        class="sub-nav-link"
        :class="{ active: activeTab === 'uv' }"
        @click="activeTab = 'uv'"
      >
        UV Dashboard
      </button>
    </div>

    <div class="dashboard-shell">
      <div class="section-heading">
        <span class="section-number">{{ sectionNumber }}</span>
        <span class="section-dot"></span>
        {{ sectionTitle }}
      </div>

      <p class="section-desc">
        {{ sectionDesc }}
      </p>

      <!-- CANCER -->
      <template v-if="activeTab === 'cancer'">
        <div class="status-bar">
          <div :class="['status', cancerStatusOk ? 'ok' : 'err']">{{ cancerStatus }}</div>
        </div>

        <div class="panel panel-spaced">
          <FilterBar @apply="onCancerApply">
            <div class="filter-group">
              <label for="cancerYear">Year</label>
              <select id="cancerYear" v-model="cancerYear">
                <option value="">All</option>
                <option v-for="y in cancerFilters.years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="cancerSex">Sex</label>
              <select id="cancerSex" v-model="cancerSex">
                <option value="">All</option>
                <option v-for="s in cancerFilters.sexes" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="cancerState">State</label>
              <select id="cancerState" v-model="cancerState">
                <option value="">All</option>
                <option v-for="st in cancerFilters.states" :key="st" :value="st">{{ st }}</option>
              </select>
            </div>
          </FilterBar>

          <SummaryCards :items="cancerSummaryItems" />

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
            <InsightCard title="Live Insights" :content="insightText" />
          </div>
        </div>
      </template>

      <!-- UV -->
      <template v-else>
        <div class="status-bar">
          <div :class="['status', uvStatusOk ? 'ok' : 'err']">{{ uvStatus }}</div>
          <button type="button" class="apply-btn" @click="onUvApply">Refresh UV data</button>
        </div>

        <div class="panel">
          <div class="filter-row uv-filter-row">
            <div class="filter-group">
              <label for="uvDate">Single Date</label>
              <input id="uvDate" v-model="uvDate" type="date" />
            </div>

            <div class="filter-group">
              <label for="uvMonth">Month</label>
              <select id="uvMonth" v-model="uvMonth">
                <option value="">All</option>
                <option v-for="m in uvFilters.months" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="uvSeason">Season</label>
              <select id="uvSeason" v-model="uvSeason">
                <option value="">All</option>
                <option v-for="s in uvFilters.seasons" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <button type="button" class="apply-btn" @click="onUvApply">Apply</button>
          </div>

          <SummaryCards :items="uvSummaryItems" :columns="4" />

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
      </template>
    </div>
  </div>
</template>

<style scoped>
.sub-nav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}

.sub-nav-link {
  width: fit-content;
  border: 0;
  cursor: pointer;
  text-decoration: none;
  padding: 14px 24px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 1rem;
  background: #e5e7eb;
  color: #111;
  transition: 0.2s ease;
}

.sub-nav-link.active {
  background: #facc15;
  color: #111;
}

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