<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', name: 'home', label: 'Home' },
  { path: '/dashboard', name: 'insights', label: 'Insights' },
  { path: '/myths', name: 'myths', label: 'Myth vs Fact' },
  { path: '/about', name: 'about', label: 'About Us' }
]

function go(path) {
  router.push(path)
}
</script>

<template>
  <nav>
    <div class="nav-links">
      <a
        v-for="item in navItems"
        :key="item.path"
        class="nav-link"
        :class="{ active: route.path === item.path }"
        @click.prevent="go(item.path)"
      >
        {{ item.label }}
      </a>
    </div>
  </nav>
</template>