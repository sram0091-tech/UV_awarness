/**
 * Base API client. Uses a configurable base URL (stored in localStorage as sunApiBase).
 */
import axios from 'axios'

const STORAGE_KEY = 'sunApiBase'
const DEFAULT_BASE = 'https://uv-fit5220-aont.onrender.com'

export function getApiBase() {
  try {
    const v = (localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE || '').trim().replace(/\/+$/, '')
    return v || DEFAULT_BASE
  } catch {
    return DEFAULT_BASE
  }
}

export function setApiBase(value) {
  const v = (value || '').trim().replace(/\/+$/, '') || DEFAULT_BASE
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {}
  return v
}

export function createApiClient() {
  const baseURL = getApiBase()
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: { Accept: 'application/json' }
  })
}

/**
 * GET request helper. Drops undefined/null/empty params.
 */
export async function apiGet(path, params = {}) {
  const client = createApiClient()
  const filtered = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      filtered[key] = value
    }
  }
  const { data } = await client.get(path, { params: filtered })
  return data
}
