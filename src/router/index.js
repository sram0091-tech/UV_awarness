import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { subtitle: 'Home Page' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { subtitle: 'Dashboard' }
  },
  {
    path: '/myths',
    name: 'myths',
    component: () => import('../views/MythsView.vue'),
    meta: { subtitle: 'Myths' }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { subtitle: 'About Us' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router