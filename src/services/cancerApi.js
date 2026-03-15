import { apiGet } from './api.js'

export async function getFilters() {
  return apiGet('/api/cancer/filters')
}

export async function getRateByState(params = {}) {
  return apiGet('/api/cancer/rate-by-state', params)
}

export async function getRateByCancerType(params = {}) {
  return apiGet('/api/cancer/rate-by-cancer-type', params)
}

export async function getTrend(params = {}) {
  return apiGet('/api/cancer/trend', params)
}

export async function getSummary(params = {}) {
  return apiGet('/api/cancer/summary', params)
}
