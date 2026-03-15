# Refactor Notes: HTML Dashboard → Vue 3 + Vite

## Project structure

```
src/
├── main.js                    # App entry, router, global styles, Chart.js registration
├── App.vue                    # Shell: Navbar + TitleBlock + router-view
├── router/
│   └── index.js               # Routes: /, /cancer, /uv, /myths, /about
├── services/
│   ├── api.js                 # Base URL (localStorage), axios client, apiGet()
│   ├── homeApi.js             # getNavigation()
│   ├── cancerApi.js           # getFilters, getRateByState, getRateByCancerType, getTrend, getSummary
│   └── uvApi.js               # getFilters, getDailyLineChart, getYearlyLineChart, getRiskExplanations, getSummary
├── views/
│   ├── HomeView.vue           # Hero, title/tagline/buttons from API, CTAs to Cancer/UV
│   ├── CancerView.vue         # Filters, summary cards, state/type/trend charts, table, legend, insights
│   ├── UvView.vue             # Filters, summary, daily/yearly charts, risk list, table
│   ├── MythsView.vue          # Static myth cards (same content as original)
│   └── AboutView.vue          # About copy and contact (same as original)
├── components/
│   ├── Navbar.vue             # Nav links (Vue Router), API base URL input
│   ├── TitleBlock.vue         # “Australia’s Sun Risk…” + subtitle from route meta
│   ├── SummaryCards.vue       # List of { label, value } cards; optional columns prop
│   ├── FilterBar.vue          # Filter row + Apply button; slot for filter groups
│   ├── InsightCard.vue        # Title + paragraph (e.g. Live Insights)
│   ├── RiskLegend.vue        # Title + list of { color, label, description }
│   └── charts/
│       ├── ChartDefaults.js   # Chart.js register + defaultOptions + barColors
│       ├── CancerStateBarChart.vue   # Grouped bar: rate2001 / rate2023 by state
│       ├── CancerTypeBarChart.vue    # Grouped bar: rate2001 / rate2023 by cancer type
│       ├── CancerTrendLineChart.vue  # Line: rate2001 / rate2023 by year
│       ├── UvDailyLineChart.vue      # Line: hourly mean/max by hour
│       └── UvYearlyLineChart.vue     # Line: hourly mean/max by date/range
└── assets/
    └── dashboard.css          # Original HTML styles (CSS variables, layout, panels, charts)
```

## Installation

```bash
cd sun-safety-frontend
npm install
npm run dev
```

Dependencies added: `vue-router`, `axios`, `chart.js`, `vue-chartjs`.

## How the original HTML was mapped to Vue

| Original HTML | Vue |
|---------------|-----|
| Single `<nav>` + API input | `Navbar.vue` (router-link + apiBase from `api.js` / localStorage) |
| `.title-block` + `#page-subtitle` | `TitleBlock.vue` (subtitle from `route.meta.subtitle`) |
| `showPage('home'/'cancer'/…) | Vue Router routes + `router-view` |
| `#page-home` hero | `HomeView.vue`; title/tagline/buttons from `GET /api/home/navigation` |
| `#page-cancer` (filters, summary, SVG charts, table, legend, insights) | `CancerView.vue` + `SummaryCards`, `FilterBar`, `InsightCard`, `RiskLegend` + Chart.js components |
| `#stateChart`, `#cancerTypeChart`, `#trendChart` (SVG) | `CancerStateBarChart`, `CancerTypeBarChart`, `CancerTrendLineChart` (Chart.js) |
| `#page-uv` (filters, summary, daily/yearly SVG charts, risk list, table) | `UvView.vue` + `UvDailyLineChart`, `UvYearlyLineChart` |
| `#dailyUvChart`, `#yearlyUvChart` (SVG) | `UvDailyLineChart.vue`, `UvYearlyLineChart.vue` (Chart.js) |
| `#page-myths` | `MythsView.vue` (static content) |
| `#page-about` | `AboutView.vue` (static content) |
| `state.apiBase`, `localStorage.sunApiBase` | `api.js`: `getApiBase()`, `setApiBase()`, `createApiClient()` |
| `apiGet(path, params)` | `api.js` `apiGet()` + axios client with `baseURL` from `getApiBase()` |
| Inline `<style>` | `assets/dashboard.css` imported in `main.js` |

## Why Chart.js instead of custom SVG

1. **Reliability** – Handles axis scaling, labels, and responsiveness for you. The original SVG code manually computed margins, scales, and paths; small data or layout changes could break rendering or cause overflow.
2. **Behaviour** – Tooltips, legends, and hover are built-in and consistent. The SVG version had no tooltips and a fixed legend.
3. **Maintainability** – Chart config is data-driven; adding a series or changing colours is straightforward. No manual path math or `createSvg()` helpers.
4. **Empty data** – Chart.js components show a “No data available” fallback when `data` is empty or null, avoiding blank or broken SVGs.
5. **Reactivity** – With Vue’s `computed` and reactive props, changing filters and refetching data automatically updates the chart; no manual DOM or `viewBox` management.

## API base URL

- Stored in `localStorage` under `sunApiBase` (default `http://127.0.0.1:8000`).
- The Navbar input binds to a ref that calls `setApiBase()` on change; all `apiGet()` calls use `getApiBase()` so switching URL and refreshing data uses the new base.
- Listen for `api-base-changed` on `window` if you need to refetch elsewhere (e.g. home navigation).

## State management

- No Pinia. Each view keeps local state (`ref`) and calls the service functions. Shared “state” is the API base in `api.js` (and localStorage).
- Loading/error/empty: each dashboard view has a status message and uses the chart components’ “No data available” when the API returns an empty array.

## Backend endpoints used

- **Home:** `GET /api/home/navigation`
- **Cancer:** `GET /api/cancer/filters`, `rate-by-state`, `rate-by-cancer-type`, `trend`, `summary` (with optional year, sex, state, cancer_type)
- **UV:** `GET /api/uv/filters`, `daily-line-chart`, `yearly-line-chart`, `risk-explanations`, `summary` (with optional date, date_from, date_to, month, season)

All requests go through `api.js` with the configurable base URL and omit undefined/null/empty query parameters.
