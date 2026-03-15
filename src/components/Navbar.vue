<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getApiBase, setApiBase } from '../services/api.js'

const router = useRouter()
const route = useRoute()
const apiBase = ref(getApiBase())

const navItems = [
  { path: '/', name: 'home', label: 'Home' },
  { path: '/cancer', name: 'cancer', label: 'Cancer Dashboard' },
  { path: '/uv', name: 'uv', label: 'UV Dashboard' },
  { path: '/myths', name: 'myths', label: 'Myths' },
  { path: '/about', name: 'about', label: 'About Us' }
]

function go(path) {
  router.push(path)
}

function onApiBaseChange() {
  apiBase.value = setApiBase(apiBase.value)
  window.dispatchEvent(new Event('api-base-changed'))
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
    <div class="nav-search">
      <input
        v-model="apiBase"
        type="text"
        placeholder="API base URL, e.g. http://127.0.0.1:8000"
        @change="onApiBaseChange"
      />
    </div>
  </nav>
</template>
