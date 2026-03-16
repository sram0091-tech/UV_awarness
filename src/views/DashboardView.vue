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
  { label: 'Max UV', value: numberOrDash(uvSummary.value?.maxUv) },
  { label: 'Average UV', value: numberOrDash(uvSummary.value?.averageUv) },
  { label: 'Highest Risk', value: uvSummary.value?.highestRiskCategory ?? '—' }
])

const uvHowToReadText = computed(() => {
  return 'Use either Month or Season to filter the dashboard. Max UV shows the strongest recorded UV level, Average UV shows the overall exposure level, the trend chart compares average and maximum UV across the selected range, and the risk guide explains what each UV category means for sun protection.'
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
    return `For ${periodLabel}, the dashboard reports a maximum UV of ${numberOrDash(s?.maxUv)}, an average UV of ${numberOrDash(s?.averageUv)}, and a highest risk category of ${highestRisk}.`
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
    return `For ${periodLabel}, UV levels peak at ${numberOrDash(maxUv)} and average ${numberOrDash(avgUv)} overall. The highest risk category is ${highestRisk}. The maximum UV line peaks around ${peakMaxLabel}, while the average UV line is strongest around ${peakMeanLabel}.`
  }

  return `For ${periodLabel}, the highest risk category is ${highestRisk}. The trend chart shows how average and maximum UV change across the visible range.`
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

          <div class="cancer-summary-wrap">
  <SummaryCards :items="cancerSummaryItems" />
</div>

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

          <div class="insight-card">
  <div class="insight-title">Understanding the rates</div>
  <div class="insight-text">
    The cancer rates shown in this dashboard are age-standardised so that states and years
    can be compared fairly. “Rate 2001” uses the age structure of the Australian population
    in 2001 as the reference population, while “Rate 2023” uses the 2023 population structure.
    All values represent cases per 100,000 people.
  </div>
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

  <div class="info-note">
  <strong>How to read this dashboard:</strong>
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
        <button type="button" class="clear-btn" @click="clearUvFilters">Clear</button>
      </div>
    </div>

    <div class="filter-helper">
  Select either a month or a season. Choosing one will clear the other.
</div>

    <SummaryCards :items="uvSummaryItems" :columns="3" />

    <div class="uv-layout">
      <div class="left-column">
        <div class="chart-card">
          <div class="chart-title">UV Trend Chart</div>
          <p class="chart-subtitle">
            Compare average UV and maximum UV across the selected time range.
          </p>
          <UvYearlyLineChart :data="yearlyChartRows" />
        </div>

        <div class="insight-card-lite">
          <div class="chart-title">Live Insight</div>
          <p class="insight-text">{{ uvInsightText }}</p>
        </div>
      </div>

      <div class="right-column">
        <div class="risk-card panel">
          <div class="risk-header">
            <h3>UV Risk Guide</h3>
            <span class="risk-badge">
              Highest current risk: {{ uvSummary?.highestRiskCategory ?? '—' }}
            </span>
          </div>

          <RiskLegend
            title="Protection guidance by UV category"
            :items="riskLegendItems"
          />
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

  .how-grid,
  .uv-layout {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    width: 100%;
  }

  .filter-helper {
  grid-column: 1 / -1;
  margin-top: 2px;
  color: #9ca3af;
  font-size: 0.9rem;
  line-height: 1.45;
}

.risk-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.risk-badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.14);
  border: 1px solid rgba(250, 204, 21, 0.25);
  color: #fef08a;
  font-size: 0.92rem;
  font-weight: 600;
}

.cancer-summary-wrap :deep(.summary-grid) {
  grid-template-columns: repeat(5, 1fr);
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

@media (max-width: 900px) {
  .cancer-summary-wrap :deep(.summary-grid) {
    grid-template-columns: 1fr !important;
  }
}

.dashboard-footnote {
  margin-top: 22px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dashboard-footnote-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.footnote-icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 22px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #111;
  background: #facc15;
  margin-top: 2px;
}

.footnote-text {
  color: #cbd5e1;
  font-size: 0.92rem;
  line-height: 1.55;
}

.footnote-text strong {
  display: block;
  margin-bottom: 4px;
  color: #f8fafc;
}

}
</style> 