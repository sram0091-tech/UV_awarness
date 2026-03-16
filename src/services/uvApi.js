import { apiGet } from './api.js'

export async function getFilters() {
  return apiGet('/api/uv/filters')
}

export async function getYearlyLineChart(params = {}) {
  return apiGet('/api/uv/yearly-line-chart', params).catch(() => [])
}

export async function getRiskExplanations() {
  return apiGet('/api/uv/risk-explanations')
}

export async function getSummary(params = {}) {
  return apiGet('/api/uv/summary', params)
}
