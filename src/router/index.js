import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { subtitle: 'Home Page' } },
  { path: '/cancer', name: 'cancer', component: () => import('../views/CancerView.vue'), meta: { subtitle: 'Cancer Dashboard' } },
  { path: '/uv', name: 'uv', component: () => import('../views/UvView.vue'), meta: { subtitle: 'UV Dashboard' } },
  { path: '/myths', name: 'myths', component: () => import('../views/MythsView.vue'), meta: { subtitle: 'Myths' } },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue'), meta: { subtitle: 'About Us' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
