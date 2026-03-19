<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const title = ref('See the Sun More Clearly')
const tagline = ref(
  'Real UV patterns. Clear skin cancer insights. Better sun-safe choices.'
)

const introText = ref(
  'Built to help people understand risk, challenge myths, and act earlier.'
)

const actions = ref([
  {
    label: 'Explore Sun Risk',
    subtext: 'See patterns, compare trends, and understand where risk is highest',
    path: '/dashboard',
    primary: true,
    icon: '☀️'
  },
  {
    label: 'Myth vs Fact',
    subtext: 'Break common sun safety myths with clear, evidence-based answers',
    path: '/myths',
    primary: false,
    icon: '✨'
  }
])


function go(path) {
  router.push(path || '/')
}
</script>

<template>
  <div class="page-content home-page">
    <div class="hero-wrap">
      <div class="home-hero">
        <p class="hero-kicker">Australia’s Sun Risk, Made Clear</p>
        <h1>{{ title }}</h1>

        <p class="home-tagline">{{ tagline }}</p>
        <p class="home-intro">{{ introText }}</p>

        <div class="home-image-strip">
          <img
            src="/homepageimage.webp"
            alt="Sun safety awareness"
            class="home-hero-image"
          >
          <div class="image-overlay">
            <div class="overlay-badge">Know your risk before the damage begins</div>
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
  padding: 22px 0 40px;
}

.hero-kicker {
  margin: 6px 0 14px;
  color: #facc15;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-hero h1 {
  max-width: 1000px;
  margin: 0 auto 16px;
  font-size: clamp(3.1rem, 5.6vw, 5.8rem);
  line-height: 0.96;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #ffffff;
}

.home-tagline {
  max-width: 860px;
  margin: 0 auto 10px;
  font-size: 1.2rem;
  line-height: 1.55;
  color: #f4f4f5;
  font-weight: 500;
}

.home-intro {
  max-width: 700px;
  margin: 0 auto 32px;
  font-size: 1rem;
  line-height: 1.6;
  color: #b9bcc6;
}

.home-image-strip {
  position: relative;
  width: 1150px;
  max-width: 100%;
  height: 540px;
  margin: 0 auto 34px;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 26px 54px rgba(0, 0, 0, 0.36);
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.03));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.overlay-badge {
  background: rgba(15, 23, 42, 0.76);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 12px 18px;
  font-size: 0.96rem;
  font-weight: 700;
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
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
}

.cta-subtext {
  font-size: 0.95rem;
  color: #c8ccd5;
  line-height: 1.5;
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
    padding: 10px 0 24px;
  }

  .home-hero h1 {
    font-size: clamp(2.5rem, 8vw, 4.2rem);
    line-height: 1.02;
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