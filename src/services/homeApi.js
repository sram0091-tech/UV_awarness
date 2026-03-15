import { apiGet } from './api.js'

export async function getNavigation() {
  return apiGet('/api/home/navigation')
}
