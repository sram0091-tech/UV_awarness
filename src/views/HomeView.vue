<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getNavigation } from '../services/homeApi.js'

const router = useRouter()
const title = ref("Your skin remembers every ray of sun.")
const tagline = ref(
  "Australia has one of the highest skin cancer rates in the world. Explore the live cancer and UV datasets through your dashboard API."
)
const buttons = ref([
  { label: 'OPEN CANCER DASHBOARD →', path: '/cancer', primary: true },
  { label: 'OPEN UV DASHBOARD', path: '/uv', primary: false }
])

onMounted(async () => {
  try {
    const data = await getNavigation()
    if (data?.title) title.value = data.title
    if (data?.tagline) tagline.value = data.tagline
    if (Array.isArray(data?.buttons) && data.buttons.length) {
      buttons.value = data.buttons.map((b, i) => ({
        label: b.label || 'Open',
        path: b.path || (i === 0 ? '/cancer' : '/uv'),
        primary: i === 0
      }))
    }
  } catch {
    // keep defaults
  }
})

function go(path) {
  router.push(path || '/')
}
</script>

<template>
  <div class="page-content">
    <div class="hero-wrap">
      <div class="home-hero">
        <h2>{{ title }}</h2>
        <div class="home-image-strip">
          <img src="/homepageimage.webp" alt="Sun Safety Dashboard" class="home-hero-image">
        </div>
        <p class="home-tagline">{{ tagline }}</p>
        <div class="home-ctas">
          <button
            v-for="(btn, i) in buttons"
            :key="i"
            :class="btn.primary ? 'btn-primary' : 'btn-secondary'"
            @click="go(btn.path)"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
