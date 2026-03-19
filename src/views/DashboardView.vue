<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SummaryCards from '../components/SummaryCards.vue'
import FilterBar from '../components/FilterBar.vue'
import InsightCard from '../components/InsightCard.vue'
import CancerStateBarChart from '../components/charts/CancerStateBarChart.vue'
import CancerTrendLineChart from '../components/charts/CancerTrendLineChart.vue'
import UvYearlyLineChart from '../components/charts/UvYearlyLineChart.vue'
import * as cancerApi from '../services/cancerApi.js'
import * as uvApi from '../services/uvApi.js'
import RiskLegend from '../components/RiskLegend.vue'

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

function extractYear(row) {
  if (!row) return null

  if (row.year != null && Number.isFinite(Number(row.year))) {
    return Number(row.year)
  }

  if (row.date) {
    const match = String(row.date).match(/\d{4}/)
    if (match) return Number(match[0])
  }

  if (row.label) {
    const match = String(row.label).match(/\d{4}/)
    if (match) return Number(match[0])
  }

  return null
}

function getTrendRate(row) {
  if (!row) return null

  const candidates = [
    row.rate2023,
    row.rate,
    row.value,
    row.asr2023,
    row.avgRate2023
  ]

  for (const candidate of candidates) {
    const n = Number(candidate)
    if (Number.isFinite(n)) return n
  }

  return null
}

/* -------------------- Cancer state -------------------- */

const cancerStatus = ref('Waiting to load cancer data…')
const cancerStatusOk = ref(true)

const cancerFilters = ref({ sexes: [], states: [] })
const cancerSex = ref('')
const cancerState = ref('')

const fullStateRates = ref([])
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

const selectedStateLabel = computed(() => cancerState.value || 'Australia')
const selectedSexLabel = computed(() => cancerSex.value || 'All sexes')

const trendChartTitle = computed(() => {
  const parts = ['Cancer Rate Over Time']

  if (cancerSex.value) parts.push(cancerSex.value)
  if (cancerState.value) {
    parts.push(cancerState.value)
  } else {
    parts.push('Australia')
  }

  return parts.join(' — ')
})

const trendChartSubtitle = computed(() => {
  const sexLabel = cancerSex.value || 'all sexes'
  const stateLabel = cancerState.value || 'Australia'
  return `See how the 2023 age-standardised rate shifts over time for ${sexLabel} in ${stateLabel}.`
})

function getNationalAverageRate() {
  const rows = Array.isArray(fullStateRates.value) ? fullStateRates.value : []

  const australiaRow = rows.find((row) => String(row.state).trim().toLowerCase() === 'australia')
  if (australiaRow) return australiaRow.rate2023

  const nonAustralia = rows.filter((row) => String(row.state).trim().toLowerCase() !== 'australia')
  if (!nonAustralia.length) return null

  const values = nonAustralia
    .map((row) => Number(row.rate2023))
    .filter((n) => Number.isFinite(n))

  if (!values.length) return null
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

function getTopStateRow() {
  const rows = Array.isArray(stateRates.value) ? stateRates.value : []
  if (!rows.length) return null
  return rows[0]
}

function getFiveYearChange() {
  const rows = Array.isArray(trend.value) ? trend.value : []
  if (!rows.length) return null

  const enriched = rows
    .map((row) => ({
      ...row,
      extractedYear: extractYear(row),
      extractedRate: getTrendRate(row)
    }))
    .filter((row) => row.extractedYear != null && row.extractedRate != null)
    .sort((a, b) => a.extractedYear - b.extractedYear)

  if (enriched.length < 2) return null

  const latest = enriched[enriched.length - 1]
  const targetYear = latest.extractedYear - 5

  let baseline = null

  for (let i = enriched.length - 1; i >= 0; i--) {
    if (enriched[i].extractedYear <= targetYear) {
      baseline = enriched[i]
      break
    }
  }

  if (!baseline) {
    baseline = enriched[0]
  }

  const latestRate = Number(latest.extractedRate)
  const baselineRate = Number(baseline.extractedRate)

  if (!Number.isFinite(latestRate) || !Number.isFinite(baselineRate) || baselineRate === 0) {
    return null
  }

  return {
    fromYear: baseline.extractedYear,
    toYear: latest.extractedYear,
    percent: ((latestRate - baselineRate) / baselineRate) * 100
  }
}

function setCancerSummaryItems() {
  const nationalAverage = getNationalAverageRate()
  const topState = getTopStateRow()
  const fiveYearChange = getFiveYearChange()

  cancerSummaryItems.value = [
    {
      label: 'Australia Average',
      value: numberOrDash(nationalAverage)
    },
    {
      label: 'Highest State Rate',
      value: topState
        ? `${topState.state} — ${numberOrDash(topState.rate2023)}`
        : '—'
    },
    {
      label: `5-Year Shift (${selectedStateLabel.value})`,
      value: fiveYearChange ? percentOrDash(fiveYearChange.percent) : '—'
    }
  ]
}

function buildCancerInsightText() {
  const nationalAverage = getNationalAverageRate()
  const topState = getTopStateRow()
  const fiveYearChange = getFiveYearChange()

  const stateLabel = cancerState.value || 'Australia'
  const sexLabel = cancerSex.value || 'all sexes'

  const sentence1 = Number.isFinite(Number(nationalAverage))
    ? `The national 2023 age-standardised rate is ${numberOrDash(nationalAverage)} per 100,000.`
    : 'The national 2023 age-standardised rate is not available for the current filters.'

  const sentence2 = topState
    ? `${topState.state} currently shows the highest visible state rate at ${numberOrDash(topState.rate2023)} per 100,000.`
    : 'A state comparison is not available for the current filters.'

  let sentence3 = ''
  if (fiveYearChange) {
    const direction =
      Number(fiveYearChange.percent) > 0
        ? 'increased'
        : Number(fiveYearChange.percent) < 0
          ? 'decreased'
          : 'remained stable'

    if (direction === 'remained stable') {
      sentence3 = `For ${sexLabel} in ${stateLabel}, the rate has remained stable from ${fiveYearChange.fromYear} to ${fiveYearChange.toYear}.`
    } else {
      sentence3 = `For ${sexLabel} in ${stateLabel}, the rate has ${direction} by ${numberOrDash(Math.abs(fiveYearChange.percent))}% from ${fiveYearChange.fromYear} to ${fiveYearChange.toYear}.`
    }
  } else {
    sentence3 = `A 5-year change could not be calculated for ${sexLabel} in ${stateLabel}.`
  }

  insightText.value = `${sentence1} ${sentence2} ${sentence3}`
}

async function loadCancerFilters() {
  const data = await cancerApi.getFilters()
  cancerFilters.value = {
    sexes: data.sexes || [],
    states: (data.states || []).filter((s) => s !== 'Australia')
  }
}

async function loadCancerDashboard() {
  setCancerStatus('Loading cancer data…', true)

  try {
    if (!cancerFilters.value.sexes?.length) await loadCancerFilters()

    const params = {
      sex: cancerSex.value || undefined,
      state: cancerState.value || undefined
    }

    const stateParams = {
      sex: cancerSex.value || undefined
    }

    const [stateRatesRes, trendRes, summaryRes] = await Promise.all([
      cancerApi.getRateByState(stateParams),
      cancerApi.getTrend(params),
      cancerApi.getSummary(params)
    ])

    fullStateRates.value = Array.isArray(stateRatesRes) ? stateRatesRes : []

    stateRates.value = Array.isArray(stateRatesRes)
      ? stateRatesRes
          .filter((row) => row.state !== 'Australia')
          .sort((a, b) => (Number(b.rate2023) || 0) - (Number(a.rate2023) || 0))
      : []

    trend.value = Array.isArray(trendRes) ? trendRes : []
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

const uvMonth = ref('')
const uvSeason = ref('')

watch(uvMonth, (newValue) => {
  if (newValue) {
    uvSeason.value = ''
  }
})

watch(uvSeason, (newValue) => {
  if (newValue) {
    uvMonth.value = ''
  }
})

const riskList = ref([])
const yearlyChartRows = ref([])
const uvSummary = ref(null)

function setUvStatus(text, ok) {
  uvStatus.value = text
  uvStatusOk.value = ok
}

const uvSummaryItems = computed(() => [
  { label: 'Peak UV', value: numberOrDash(uvSummary.value?.maxUv) },
  { label: 'Average UV', value: numberOrDash(uvSummary.value?.averageUv) },
  { label: 'Highest Risk Level', value: uvSummary.value?.highestRiskCategory ?? '—' }
])

const uvHowToReadText = computed(() => {
  return 'Choose either a month or a season to refine the view. Peak UV shows the strongest recorded level, Average UV shows the overall exposure level, the trend chart compares average and maximum UV across the selected range, and the risk guide explains what each category means for sun protection.'
})

const activeRiskCategory = computed(() =>
  String(uvSummary.value?.highestRiskCategory ?? '').trim().toLowerCase()
)

function riskColor(category) {
  const value = String(category ?? '').toLowerCase()

  if (value.includes('low')) return '#7dd3fc'
  if (value.includes('moderate')) return '#fde047'
  if (value.includes('high') && !value.includes('very')) return '#fb923c'
  if (value.includes('very')) return '#f97316'
  if (value.includes('extreme')) return '#ef4444'

  return '#94a3b8'
}

const riskLegendItems = computed(() => {
  const rows = Array.isArray(riskList.value) ? riskList.value : []

  return rows.map((item) => {
    const category = String(item.uvCategory ?? '').trim().toLowerCase()

    return {
      label: `${item.uvCategory} (${item.uvNumericCategory})`,
      description: item.riskMessage,
      color: riskColor(category),
      active: category === activeRiskCategory.value
    }
  })
})

const uvInsightText = computed(() => {
  const s = uvSummary.value
  const rows = yearlyChartRows.value

  if (!s && !rows.length) {
    return 'No UV records were returned for the selected filter combination.'
  }

  const highestRisk = s?.highestRiskCategory ?? 'unknown'
  const maxUv = Number(s?.maxUv)
  const avgUv = Number(s?.averageUv)
  const periodLabel = uvMonth.value || uvSeason.value || 'the selected period'

  if (!rows.length) {
    return `For ${periodLabel}, the view reports a peak UV of ${numberOrDash(s?.maxUv)}, an average UV of ${numberOrDash(s?.averageUv)}, and a highest risk category of ${highestRisk}.`
  }

  const maxPoint = rows.reduce((best, row) => {
    const current = Number(row.hourlyMaxUv ?? 0)
    const bestValue = Number(best?.hourlyMaxUv ?? -1)
    return current > bestValue ? row : best
  }, null)

  const meanPoint = rows.reduce((best, row) => {
    const current = Number(row.hourlyMeanUv ?? 0)
    const bestValue = Number(best?.hourlyMeanUv ?? -1)
    return current > bestValue ? row : best
  }, null)

  const peakMaxLabel = maxPoint?.label ?? 'the visible range'
  const peakMeanLabel = meanPoint?.label ?? 'the visible range'

  if (Number.isFinite(maxUv) && Number.isFinite(avgUv)) {
    return `For ${periodLabel}, UV peaks at ${numberOrDash(maxUv)} and averages ${numberOrDash(avgUv)} overall. The highest risk level is ${highestRisk}. The maximum UV line peaks around ${peakMaxLabel}, while the average UV line is strongest around ${peakMeanLabel}.`
  }

  return `For ${periodLabel}, the highest risk level is ${highestRisk}. The trend chart shows how average and maximum UV change across the visible range.`
})

async function loadUvFilters() {
  const data = await uvApi.getFilters()
  uvFilters.value = {
    months: normalizeFilterList(data.months ?? data.month),
    seasons: normalizeFilterList(data.seasons ?? data.season)
  }
}

function formatUvTrendLabel(row, index) {
  if (row?.date) {
    const raw = String(row.date)
    if (raw.length >= 10) return raw.slice(5, 10)
    return raw
  }
  if (row?.month) return String(row.month)
  if (row?.season) return String(row.season)
  if (row?.label) return String(row.label)
  return String(index + 1)
}

async function loadUvDashboard() {
  setUvStatus('Loading UV data…', true)

  try {
    const params = {
      month: uvMonth.value || undefined,
      season: uvSeason.value || undefined
    }

    const [riskRes, summaryRes, yearlyRes] = await Promise.all([
      uvApi.getRiskExplanations(),
      uvApi.getSummary(params),
      uvApi.getYearlyLineChart(params).catch(() => [])
    ])

    riskList.value = Array.isArray(riskRes) ? riskRes : []
    uvSummary.value = summaryRes

    const yearly = Array.isArray(yearlyRes) ? yearlyRes : []

    yearlyChartRows.value = yearly.slice(0, 31).map((r, i) => ({
      label: formatUvTrendLabel(r, i),
      date: r.date,
      hourlyMeanUv: r.hourlyMeanUv ?? r.hourly_mean_uv,
      hourlyMaxUv: r.hourlyMaxUv ?? r.hourly_max_uv
    }))

    setUvStatus('UV data loaded successfully.', true)
  } catch (err) {
    setUvStatus(`Unable to load UV data: ${err.message}`, false)
  }
}

function clearUvFilters() {
  uvMonth.value = ''
  uvSeason.value = ''
  loadUvDashboard()
}

function onUvApply() {
  loadUvDashboard()
}

/* -------------------- Lifecycle -------------------- */

const sectionNumber = computed(() => (activeTab.value === 'cancer' ? '01' : '02'))
const sectionTitle = computed(() =>
  activeTab.value === 'cancer' ? 'Cancer Insights' : 'UV Conditions'
)
const sectionDesc = computed(() =>
  activeTab.value === 'cancer'
    ? 'See how cancer rates compare across Australian states and how they shift over time.'
    : 'Explore Melbourne UV patterns, risk levels, and how conditions change across dates and seasons.'
)

onMounted(async () => {
  try {
    await Promise.allSettled([loadCancerFilters(), loadUvFilters()])
  } catch {}

  await Promise.allSettled([loadCancerDashboard(), loadUvDashboard()])
})
</script>

<template>
  <div class="dashboard-page">
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
        <div>{{ sectionNumber }}</div>
        <h2>{{ sectionTitle }}</h2>
      </div>

      <p class="section-desc">{{ sectionDesc }}</p>
    </div>

    <template v-if="activeTab === 'cancer'">
      <div v-if="!cancerStatusOk" class="status-bar">
        <div class="status err">{{ cancerStatus }}</div>
      </div>

      <div class="panel panel-spaced">
        <FilterBar @apply="onCancerApply">
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
          <strong>How to read this view:</strong>
          The charts and cards show the 2023 age-standardised cancer rate per 100,000 people. Use Sex and State to narrow the view and see how the trend changes with your selection.
        </div>

        <div class="chart-card chart-card-lg">
          <div class="chart-title">{{ trendChartTitle }}</div>
          <p class="chart-subtitle">{{ trendChartSubtitle }}</p>
          <CancerTrendLineChart :data="trend" />
        </div>

        <div class="cancer-summary-wrap">
          <SummaryCards :items="cancerSummaryItems" :columns="3" />
        </div>

        <div class="insight-card-wrap">
          <InsightCard title="What Stands Out" :content="insightText" />
        </div>

        <div class="chart-card">
          <div class="chart-title">State Comparison</div>
          <p class="chart-subtitle">
            Compare 2023 age-standardised rates by state, ordered from highest to lowest.
          </p>
          <CancerStateBarChart :data="stateRates" />
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="!uvStatusOk" class="status-bar">
        <div class="status err">{{ uvStatus }}</div>
      </div>

      <div class="info-note">
        <strong>How to read this view:</strong>
        {{ uvHowToReadText }}
      </div>

      <div class="panel panel-spaced">
        <div class="filter-row uv-filter-row">
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

          <div class="filter-actions">
            <button type="button" class="apply-btn" @click="onUvApply">Apply</button>
            <button type="button" class="apply-btn" @click="clearUvFilters">Clear</button>
          </div>

          <div class="filter-helper">
            Select either a month or a season. Choosing one will clear the other.
          </div>
        </div>

        <SummaryCards :items="uvSummaryItems" :columns="3" />

        <div class="uv-main-grid">
          <div class="uv-chart-panel chart-card">
            <div class="chart-title">UV Pattern Over Time</div>
            <p class="chart-subtitle">
              Compare average UV and peak UV across the selected time range.
            </p>
            <UvYearlyLineChart :data="yearlyChartRows" />
          </div>

          <div class="uv-insight-panel insight-card-wrap">
            <InsightCard
              title="What Stands Out"
              :content="uvInsightText"
            />
          </div>
        </div>

        <div class="uv-risk-panel">
          <RiskLegend
            title="UV Risk Guide"
            :items="riskLegendItems"
          />
        </div>
      </div>
    </template>
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
  color: #9ca3af;
}

.chart-card-lg {
  margin-bottom: 0;
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

.filter-helper {
  grid-column: 1 / -1;
  margin-top: 2px;
  color: #9ca3af;
  font-size: 0.9rem;
  line-height: 1.45;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: end;
}

.cancer-summary-wrap :deep(.summary-grid) {
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.cancer-summary-wrap :deep(.summary-card) {
  min-width: 0;
}

.cancer-summary-wrap :deep(.summary-label) {
  font-size: 0.92rem;
  font-weight: 700;
  color: #f3f4f6;
  letter-spacing: 0.01em;
}

.cancer-summary-wrap :deep(.summary-value) {
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  line-height: 1.08;
  font-weight: 700;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.uv-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: start;
  margin-top: 18px;
}

.uv-chart-panel {
  min-width: 0;
}

.uv-insight-panel {
  min-width: 0;
}

.uv-risk-panel {
  margin-top: 20px;
}

.uv-insight-panel :deep(.insight-card),
.uv-risk-panel :deep(.legend-card) {
  height: 100%;
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

  .section-desc {
    max-width: 100%;
  }

  .uv-main-grid {
    grid-template-columns: 1fr;
  }

  .uv-risk-panel {
    margin-top: 16px;
  }

  .filter-actions {
    width: 100%;
  }

  .cancer-summary-wrap :deep(.summary-grid) {
    grid-template-columns: 1fr !important;
  }
}
</style>