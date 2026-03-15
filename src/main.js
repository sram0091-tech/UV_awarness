import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/dashboard.css'
import './components/charts/ChartDefaults.js' // register Chart.js components and theme

const app = createApp(App)
app.use(router)
app.mount('#app')
