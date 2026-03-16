<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getNavigation } from '../services/homeApi.js'

const router = useRouter()

const title = ref('Sun Safety Dashboard')
const tagline = ref(
  'Australia experiences some of the highest skin cancer rates globally. Explore UV exposure patterns, compare cancer incidence trends, and challenge common myths about sun safety through one interactive platform.'
)

const introText = ref(
  'Use the dashboard to explore cancer incidence and UV insights, or visit the myths page for quick, evidence-based facts about sun protection.'
)

const actions = ref([
  {
    label: 'Cancer Incidence & UV Insights Dashboard',
    subtext: 'Explore cancer and UV data in one place',
    path: '/dashboard',
    primary: true,
    icon: '📊'
  },
  {
    label: 'Sun Safety Myths',
    subtext: 'Debunk common myths with evidence',
    path: '/myths',
    primary: false,
    icon: '☀️'
  }
])

onMounted(async () => {
  try {
    const data = await getNavigation()
    if (data?.title) title.value = data.title
    if (data?.tagline) tagline.value = data.tagline
  } catch {
    // keep defaults
  }
})

function go(path) {
  router.push(path || '/')
}
</script>

<template>
  <div class="page-content home-page">
    <div class="hero-wrap">
      <div class="home-hero">
        <p class="hero-kicker">Australia’s Sun Risk in Plain Sight</p>
        <h1>{{ title }}</h1>

        <p class="home-tagline">{{ tagline }}</p>
        <p class="home-intro">{{ introText }}</p>

        <div class="home-image-strip">
          <img
            src="/homepageimage.webp"
            alt="Sun Safety Dashboard"
            class="home-hero-image"
          >
          <div class="image-overlay">
            <div class="overlay-badge">Sun awareness starts with better decisions</div>
          </div>
        </div>

        <div class="home-ctas">
          <button
            v-for="(item, i) in actions"
            :key="i"
            class="cta-card"
            :class="{ primary: item.primary }"
            @click="go(item.path)"
          >
            <div class="cta-icon">{{ item.icon }}</div>

            <div class="cta-copy">
              <span class="cta-title">{{ item.label }}</span>
              <span class="cta-subtext">{{ item.subtext }}</span>
            </div>

            <span class="cta-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding-top: 10px;
}

.hero-wrap {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
}
.home-hero {
  text-align: center;
  padding: 12px 0 32px;
}

.hero-kicker {
  margin: 6px 0 12px;
  color: #facc15;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.home-hero h1 {
  margin: 0 0 16px;
  font-size: clamp(2.7rem, 5vw, 5.2rem);
  line-height: 1.02;
}

.home-tagline {
  max-width: 1100px;
  margin: 0 auto 12px;
  font-size: 1.14rem;
  line-height: 1.7;
  color: #f4f4f5;
}

.home-intro {
  max-width: 980px;
  margin: 0 auto 28px;
  font-size: 1rem;
  line-height: 1.7;
  color: #b9bcc6;
}

.home-image-strip {
  position: relative;
  width: 1150px;
  max-width: 100%;
  height: 520px;
  margin: 0 auto 30px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.home-hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 60%;
  transition: transform 0.5s ease;
}

.home-image-strip:hover .home-hero-image {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.04));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 18px;
}

.overlay-badge {
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 0.94rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.home-ctas {
  display: grid;
  grid-template-columns: repeat(2, minmax(320px, 520px));
  justify-content: center;
  gap: 22px;
  margin: 0 auto;
}

.cta-card {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  border-radius: 24px;
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, #151720 0%, #10131a 100%);
  color: #f8fafc;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.cta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.28);
  border-color: rgba(250, 204, 21, 0.35);
}

.cta-card.primary {
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.16) 0%, rgba(250, 204, 21, 0.08) 100%);
  border-color: rgba(250, 204, 21, 0.32);
}

.cta-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.cta-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cta-title {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
}

.cta-subtext {
  font-size: 0.95rem;
  color: #c8ccd5;
  line-height: 1.45;
}

.cta-arrow {
  margin-left: auto;
  font-size: 2rem;
  font-weight: 700;
  color: #facc15;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .home-hero {
    padding: 8px 0 24px;
  }

  .home-image-strip {
    height: 320px;
    margin-bottom: 22px;
  }

  .home-hero-image {
    object-position: center 22%;
  }

  .home-ctas {
    grid-template-columns: 1fr;
  }

  .home-tagline,
  .home-intro {
    max-width: 100%;
  }

  .cta-card {
    padding: 20px;
  }

  .cta-icon {
    width: 60px;
    height: 60px;
    font-size: 1.6rem;
  }

  .cta-title {
    font-size: 1.02rem;
  }

  .cta-subtext {
    font-size: 0.9rem;
  }
}
</style>