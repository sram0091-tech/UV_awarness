<script setup>
import { ref, computed, onMounted } from 'vue'
import SummaryCards from '../components/SummaryCards.vue'
import FilterBar from '../components/FilterBar.vue'
import InsightCard from '../components/InsightCard.vue'
import CancerStateBarChart from '../components/charts/CancerStateBarChart.vue'
import CancerTrendLineChart from '../components/charts/CancerTrendLineChart.vue'
import UvDailyLineChart from '../components/charts/UvDailyLineChart.vue'
import UvYearlyLineChart from '../components/charts/UvYearlyLineChart.vue'
import * as cancerApi from '../services/cancerApi.js'
import * as uvApi from '../services/uvApi.js'

const activeTab = ref('cancer')

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

const cancerFilters = ref({ years: [], sexes: [], states: [] })
const cancerYear = ref('')
const cancerSex = ref('')
const cancerState = ref('')

const stateRates = ref([])
const trend = ref([])
const cancerSummary = ref(null)

const cancerSummaryItems = ref([])
const insightText = ref(
  'Use the filters to explore how cancer rates vary by state and across time.'
)

function setCancerStatus(text, ok) {
  cancerStatus.value = text
  cancerStatusOk.value = ok
}

function setCancerSummaryItems() {
  const s = cancerSummary.value

  if (!s) {
    cancerSummaryItems.value = [
      { label: 'Avg ASR (2001)', value: '—' },
      { label: 'Avg ASR (2023)', value: '—' },
      { label: 'Top State', value: '—' },
      { label: 'Top ASR 2023', value: '—' },
      { label: 'Change %', value: '—' }
    ]
    return
  }

  cancerSummaryItems.value = [
    { label: 'Avg ASR (2001)', value: numberOrDash(s.averageRate2001) },
    { label: 'Avg ASR (2023)', value: numberOrDash(s.averageRate2023) },
    { label: 'Top State', value: s.highestRateState ?? '—' },
    { label: 'Top ASR 2023', value: numberOrDash(s.highestRate2023) },
    { label: 'Change %', value: percentOrDash(s.rateChangePercent) }
  ]
}

function buildCancerInsightText() {
  if (!cancerSummary.value) {
    insightText.value = 'No cancer records were returned for the current filter combination.'
    return
  }

const stateName = (cancerSummary.value.highestRateState ?? cancerState.value) || 'the selected state'
  const rate2001 = cancerSummary.value.averageRate2001
  const rate2023 = cancerSummary.value.averageRate2023
  const changePct = cancerSummary.value.rateChangePercent

  let stateSentence = ''
  if (stateName && rate2001 != null && rate2023 != null) {
    stateSentence = `${stateName} records ${numberOrDash(rate2023)} in 2023 compared with ${numberOrDash(rate2001)} in 2001.`
  } else {
    stateSentence = 'A state-level comparison is not available for the current selection.'
  }

  let changeSentence = ''
  if (changePct != null && Number.isFinite(Number(changePct))) {
    const pct = Number(changePct)
    if (pct > 0) {
      changeSentence = `That represents an increase of ${numberOrDash(pct)}% over the comparison period.`
    } else if (pct < 0) {
      changeSentence = `That represents a decrease of ${numberOrDash(Math.abs(pct))}% over the comparison period.`
    } else {
      changeSentence = 'The rate remains unchanged across the comparison period.'
    }
  } else {
    changeSentence = 'Change across the comparison period is not available.'
  }

  let trendSentence = ''
  if (cancerYear.value) {
    trendSentence = 'Clear the year filter to view the long-term trend over time.'
  } else if (trend.value.length > 1) {
    trendSentence = 'The yearly trend chart below shows how the rate changes over time.'
  } else {
    trendSentence = 'A long-term trend is not available for the current selection.'
  }

  insightText.value = `${stateSentence} ${changeSentence} ${trendSentence}`
}

async function loadCancerFilters() {
  const data = await cancerApi.getFilters()
  cancerFilters.value = {
    years: data.years || [],
    sexes: data.sexes || [],
    states: (data.states || []).filter((s) => s !== 'Australia')
  }
}

async function loadCancerDashboard() {
  setCancerStatus('Loading cancer data…', true)

  try {
    if (!cancerFilters.value.years?.length) await loadCancerFilters()

    const params = {
      year: cancerYear.value || undefined,
      sex: cancerSex.value || undefined,
      state: cancerState.value || undefined
    }

    const [stateRatesRes, trendRes, summaryRes] = await Promise.all([
      cancerApi.getRateByState(params),
      cancerApi.getTrend(params),
      cancerApi.getSummary(params)
    ])

    stateRates.value = Array.isArray(stateRatesRes)
      ? stateRatesRes
          .filter((row) => row.state !== 'Australia')
          .sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))
      : []

    trend.value = Array.isArray(trendRes) ? trendRes : []
    console.log('Trend data:', trend.value)
    cancerSummary.value = summaryRes

    setCancerSummaryItems()
    buildCancerInsightText()

    setCancerStatus('Cancer data loaded successfully.', true)
  } catch (err) {
    setCancerStatus(`Unable to load cancer data: ${err.message}`, false)
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
  setUvStatus('Loading UV data…', true)

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

    setUvStatus('UV data loaded successfully.', true)
  } catch (err) {
    setUvStatus(`Unable to load UV data: ${err.message}`, false)
  }
}

function onUvApply() {
  loadUvDashboard()
}

/* -------------------- Lifecycle -------------------- */

const sectionNumber = computed(() => (activeTab.value === 'cancer' ? '01' : '02'))
const sectionTitle = computed(() =>
  activeTab.value === 'cancer' ? 'Cancer Dashboard' : 'UV Dashboard'
)
const sectionDesc = computed(() =>
  activeTab.value === 'cancer'
    ? 'Compare age-standardised cancer rates across Australian states and see how they change over time.'
    : 'Explore Melbourne UV levels, risk categories, and trends across days and seasons.'
)

onMounted(async () => {
  try {
    await Promise.allSettled([loadCancerFilters(), loadUvFilters()])
  } catch {}

  await Promise.allSettled([loadCancerDashboard(), loadUvDashboard()])
})
</script>

<template>
  <div class="page-content dashboard-page">
    <div class="dashboard-shell">
      <div class="dashboard-header">
        <div class="dashboard-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'cancer' }"
            @click="activeTab = 'cancer'"
          >
            Cancer
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'uv' }"
            @click="activeTab = 'uv'"
          >
            UV
          </button>
        </div>

        <div class="section-heading">
          <span class="section-number">{{ sectionNumber }}</span>
          <span class="section-dot"></span>
          {{ sectionTitle }}
        </div>

        <p class="section-desc">
          {{ sectionDesc }}
        </p>
      </div>

      <!-- CANCER -->
      <template v-if="activeTab === 'cancer'">
        <div v-if="!cancerStatusOk" class="status-bar">
          <div class="status err">{{ cancerStatus }}</div>
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

          <div class="info-note">
            <strong>How to read this dashboard:</strong>
            Rate 2001 means the age-standardised rate based on the 2001 Australian Standard Population
            (per 100,000). Rate 2023 means the age-standardised rate based on the 2023 Australian population
            (per 100,000).
          </div>

          <SummaryCards :items="cancerSummaryItems" />

          <div class="insight-card-wrap">
            <InsightCard title="Key Insight" :content="insightText" />
          </div>

          <div class="chart-card">
            <div class="chart-title">Rate by State</div>
            <p class="chart-subtitle">
              Compares age-standardised rates by state for 2001 and 2023, ordered by highest 2023 value.
            </p>
            <CancerStateBarChart :data="stateRates" />
          </div>

          <div class="chart-card chart-card-lg">
            <div class="chart-title">Yearly Trend</div>
            <p class="chart-subtitle">Track how the selected rate changes across time.</p>
            <CancerTrendLineChart :data="trend" />
          </div>
        </div>
      </template>

      <!-- UV -->
      <template v-else>
        <div v-if="!uvStatusOk" class="status-bar">
          <div class="status err">{{ uvStatus }}</div>
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
              <div class="chart-card chart-gap">
                <div class="chart-title">Daily UV Line Chart</div>
                <UvDailyLineChart :data="dailyChartRows" />
              </div>

              <div class="chart-card">
                <div class="chart-title">Yearly / Range UV Line Chart</div>
                <UvYearlyLineChart :data="yearlyChartRows" />
              </div>
            </div>

            <div>
              <div class="risk-card panel chart-gap">
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
.dashboard-page {
  padding-top: 24px;
}


.dashboard-header {
  margin-bottom: 18px;
}

.dashboard-tabs {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  margin-bottom: 14px;
  background: #11131a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.tab-btn {
  border: 0;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.98rem;
  background: transparent;
  color: #d1d5db;
  transition: 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.tab-btn.active {
  background: #facc15;
  color: #111;
}

.section-heading {
  margin-bottom: 8px;
}

.section-desc {
  max-width: 760px;
  margin: 0;
}

.panel-spaced {
  display: grid;
  gap: 20px;
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

.chart-gap {
  margin-bottom: 18px;
}

.info-note {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.18);
  color: #e5e7eb;
  font-size: 0.95rem;
  line-height: 1.5;
}

.insight-card-wrap {
  margin-top: -4px;
}

.insight-layout {
  margin-top: 20px;
  align-items: start;
}

.table-card table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 900px) {
  .dashboard-tabs {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1 1 auto;
    text-align: center;
  }

  .panel-spaced {
    gap: 16px;
  }

  .insight-layout {
    margin-top: 16px;
  }

  .section-desc {
    max-width: 100%;
  }
}
</style>