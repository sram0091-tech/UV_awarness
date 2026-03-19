<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'

const myths = [
  {
    title: '☁️ Myth 1: Cloudy means safe',
    wrong: '"If it’s cloudy, UV exposure is low."',
    right: 'Cloud cover does not remove UV risk. UV can still be high enough to damage skin.',
    citationLabel: 'Parisi et al. (2008) – UV index and cloud cover study',
    citationUrl: 'https://doi.org/10.1007/s00484-007-0106-7'
  },
  {
    title: '🏖️ Myth 2: Sunscreen is only for the beach',
    wrong: '"Daily commuting doesn’t need sun protection."',
    right: 'Everyday outdoor exposure can still contribute to cumulative skin damage over time, even during routine activities such as commuting or walking outside.',
    citationLabel: 'Review article on sunscreen and daily photoprotection',
    citationUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4259210/'
  },
  {
    title: '🌞 Myth 3: A tan is healthy',
    wrong: '"A tan is a sign of strong, healthy skin."',
    right: 'Tanning is a biological response to DNA damage caused by ultraviolet radiation. It is a sign of skin injury, not health.',
    citationLabel: 'Cancer Council Australia – Sun safety and sunscreen guidance',
    citationUrl: 'https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/sunscreen'
  },
  {
    title: '🧴 Myth 4: Base tan protects you',
    wrong: '"Getting a base tan before holiday prevents sunburn."',
    right: 'A base tan provides only minimal protection (about SPF 3–4) and still involves UV damage to the skin. It does not replace sunscreen or other sun protection.',
    citationLabel: 'Skin Cancer Foundation – The truth about base tans',
    citationUrl: 'https://www.skincancer.org/risk-factors/tanning/'
  },
  {
    title: '🌍 Myth 5: Dark skin doesn’t need protection',
    wrong: '"People with darker skin don’t get skin cancer or sun damage."',
    right: 'While melanin offers some protection, UV still damages all skin types. Skin cancer and sun damage can affect everyone; detection may be later in skin of color.',
    citationLabel: 'Skin Cancer Foundation – Skin cancer in skin of color',
    citationUrl: 'https://www.skincancer.org/skin-cancer-information/skin-cancer-skin-of-color/'
  },
  {
    title: '🪟 Myth 6: You’re safe behind glass',
    wrong: '"Sitting by a window or in a car protects you from UV."',
    right: 'UVA rays pass through glass and can still reach your skin, causing aging and increasing cancer risk. Sun protection matters indoors near windows too.',
    citationLabel: 'WHO – UV radiation and the skin',
    citationUrl: 'https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-(uv)'
  }
]

const currentIndex = ref(0)
const answered = ref(false)
const answerCorrect = ref(false)
const selectedAnswer = ref('')
const score = ref(0)
const copiedLabel = ref(null)
const cardRef = ref(null)

const currentMyth = computed(() => myths[currentIndex.value] || null)
const progressPercent = computed(() => ((currentIndex.value) / myths.length) * 100)
const isFinished = computed(() => currentIndex.value >= myths.length)

function chooseAnswer(choice) {
  if (answered.value || !currentMyth.value) return

  selectedAnswer.value = choice
  answerCorrect.value = choice === 'myth'
  answered.value = true

  if (answerCorrect.value) {
    score.value += 1
  }
}

function nextCard() {
  if (currentIndex.value < myths.length) {
    currentIndex.value += 1
  }
  answered.value = false
  answerCorrect.value = false
  selectedAnswer.value = ''
}

function restartGame() {
  currentIndex.value = 0
  answered.value = false
  answerCorrect.value = false
  selectedAnswer.value = ''
  score.value = 0
}

function getShareText(myth) {
  return `${myth.title}\n\nMyth: ${myth.wrong}\nFact: ${myth.right}\nSource: ${myth.citationUrl}`
}

function getShareUrl() {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

function isLikelyMobile() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  return (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0) || window.innerWidth <= 768
}

async function copyToClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } else {
    await navigator.clipboard.writeText(text)
  }
}

function showCopied(id) {
  copiedLabel.value = id
  setTimeout(() => {
    copiedLabel.value = null
  }, 1500)
}

async function shareWithNative(myth) {
  const text = getShareText(myth)
  const url = getShareUrl()
  const useNativeShare = isLikelyMobile() && typeof navigator !== 'undefined' && navigator.share

  if (useNativeShare) {
    try {
      await navigator.share({
        title: myth.title,
        text: text.replace(/\n/g, ' ').slice(0, 220),
        url
      })
      showCopied('share')
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  await copyToClipboard(text)
  showCopied('share')
}

function shareToTwitter(myth) {
  const text = `${myth.title} – Sun safety facts from Australia's Sun Risk in Plain Sight`
  const url = getShareUrl()
  const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

function shareToFacebook() {
  const url = getShareUrl()
  const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

function shareToLinkedIn() {
  const url = getShareUrl()
  const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

async function getCardImageBlob() {
  const el = cardRef.value
  if (!el) return null

  const canvas = await html2canvas(el, {
    backgroundColor: '#1f1f1f',
    scale: 2,
    useCORS: true,
    ignoreElements: (element) => element.classList.contains('myth-share')
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1)
  })
}

async function shareCardAsImage(myth) {
  const blob = await getCardImageBlob()
  if (!blob) return

  const file = new File([blob], `sun-safety-myth-${currentIndex.value + 1}.png`, { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: myth.title,
        text: getShareText(myth),
        files: [file]
      })
      showCopied('share-img')
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
  showCopied('share-img')
}

async function shareToInstagram(myth) {
  const blob = await getCardImageBlob()
  if (!blob) return

  const file = new File([blob], `sun-safety-myth-${currentIndex.value + 1}.png`, { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: myth.title,
        text: getShareText(myth),
        files: [file]
      })
      showCopied('share-ig')
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sun-safety-myth-${currentIndex.value + 1}.png`
  a.click()
  URL.revokeObjectURL(url)
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  showCopied('share-ig')
}

async function copyMythText(myth) {
  await copyToClipboard(getShareText(myth))
  showCopied('copy')
}
</script>

<template>
  <div class="page-content">
    <div class="myths-wrap">
      <div class="section-heading">
        <span class="section-number">03</span>
        <span class="section-dot"></span>
        Sun Safety Myth Game
      </div>

      <div class="game-topbar" v-if="!isFinished">
        <div class="game-progress-text">
          Myth {{ currentIndex + 1 }} of {{ myths.length }}
        </div>
        <div class="game-score">
          Score: {{ score }}/{{ myths.length }}
        </div>
      </div>

      <div class="progress-track" v-if="!isFinished">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <div v-if="!isFinished" class="deck-wrap">
        <div class="stack-card back back-2"></div>
        <div class="stack-card back back-1"></div>

        <div class="myth-card game-card" ref="cardRef">
          <div class="myth-card-title">{{ currentMyth.title }}</div>

          <div class="myth-row myth-only">
            <div class="badge x">?</div>
            <div>{{ currentMyth.wrong }}</div>
          </div>

          <div v-if="!answered" class="game-actions">
            <p class="game-question">Is this a myth or a fact?</p>

            <div class="answer-buttons">
              <button type="button" class="answer-btn answer-myth" @click="chooseAnswer('myth')">
                Myth
              </button>
              <button type="button" class="answer-btn answer-fact" @click="chooseAnswer('fact')">
                Fact
              </button>
            </div>
          </div>

          <div v-else class="myth-reveal">
            <div
              class="result-banner"
              :class="answerCorrect ? 'correct' : 'wrong-answer'"
            >
              {{ answerCorrect ? 'Correct — this is a myth.' : 'Not quite — this is a myth.' }}
            </div>

            <div class="myth-row">
              <div class="badge ok">✓</div>
              <div>{{ currentMyth.right }}</div>
            </div>

            <div class="myth-citation">
              <span class="citation-label">Source</span>
              <a
                :href="currentMyth.citationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="citation-link"
              >
                {{ currentMyth.citationLabel }}
              </a>
            </div>

            <div class="myth-share">
              <span class="myth-share-label">Share</span>

              <button
                type="button"
                class="share-btn"
                :title="copiedLabel === 'share' ? 'Copied!' : 'Copy myth text to share'"
                @click="shareWithNative(currentMyth)"
              >
                {{ copiedLabel === 'share' ? 'Copied!' : 'Share' }}
              </button>

              <button
                type="button"
                class="share-btn"
                title="Share on X / Twitter"
                @click="shareToTwitter(currentMyth)"
              >
                X
              </button>

              <button
                type="button"
                class="share-btn"
                title="Share on Facebook"
                @click="shareToFacebook()"
              >
                FB
              </button>

              <button
                type="button"
                class="share-btn"
                title="Share on LinkedIn"
                @click="shareToLinkedIn()"
              >
                In
              </button>

              <button
                type="button"
                class="share-btn share-btn-ig"
                :title="copiedLabel === 'share-ig' ? 'Done!' : 'Share card image to Instagram'"
                @click="shareToInstagram(currentMyth)"
              >
                {{ copiedLabel === 'share-ig' ? 'OK' : 'IG' }}
              </button>

              <button
                type="button"
                class="share-btn share-btn-img"
                :title="copiedLabel === 'share-img' ? 'Done!' : 'Share as card image'"
                @click="shareCardAsImage(currentMyth)"
              >
                {{ copiedLabel === 'share-img' ? 'Done!' : 'Image' }}
              </button>

              <button
                type="button"
                class="share-btn copy"
                :title="copiedLabel === 'copy' ? 'Copied!' : 'Copy myth text'"
                @click="copyMythText(currentMyth)"
              >
                {{ copiedLabel === 'copy' ? 'Copied!' : 'Copy text' }}
              </button>
            </div>

            <div class="next-wrap">
              <button type="button" class="next-btn" @click="nextCard">
                {{ currentIndex === myths.length - 1 ? 'Finish game' : 'Next myth' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="finish-card">
        <div class="finish-badge">Completed</div>
        <h3 class="finish-title">You busted all the myths</h3>
        <p class="finish-score">Final score: {{ score }} / {{ myths.length }}</p>
        <p class="finish-text">
          Great job. You can replay the myth game or share what you learned.
        </p>
        <button type="button" class="restart-btn" @click="restartGame">
          Play again
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.myths-wrap {
  width: 100%;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: clamp(26px, 3.2vw, 36px);
  font-weight: 700;
  color: #f5f5f5;
}

.section-number {
  color: #f7c948;
  font-weight: 800;
  font-size: 1em;
}

.section-dot {
  width: 10px;
  height: 10px;
  background: #f7c948;
  border-radius: 50%;
}

.game-topbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  color: #d8d8d8;
  font-size: 15px;
  font-weight: 600;
}

.progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-bottom: 30px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f7c948, #ffb703);
  transition: width 0.3s ease;
}

.deck-wrap {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  padding-top: 24px;
}

.stack-card {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  border-radius: 22px;
  background: #1d1d1d;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.back-1 {
  top: 10px;
  height: 100%;
  opacity: 0.55;
  transform: translateX(-50%) scale(0.985);
}

.back-2 {
  top: 20px;
  height: 100%;
  opacity: 0.3;
  transform: translateX(-50%) scale(0.97);
}

.myth-card {
  background: #232323;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  color: #f1f1f1;
  box-sizing: border-box;
  position: relative;
  z-index: 3;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.game-card {
  min-height: 420px;
}

.myth-card-title {
  font-size: clamp(24px, 2.3vw, 34px);
  font-weight: 700;
  margin-bottom: 18px;
  line-height: 1.3;
}

.myth-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
  line-height: 1.65;
  font-size: clamp(16px, 1.7vw, 20px);
}

.badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.badge.x {
  background: rgba(255, 107, 107, 0.18);
  color: #ff8b8b;
}

.badge.ok {
  background: rgba(76, 175, 80, 0.18);
  color: #91e39a;
}

.game-actions {
  margin-top: 28px;
}

.game-question {
  color: #f7c948;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
}

.answer-buttons {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.answer-btn {
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.answer-btn:hover {
  transform: translateY(-1px);
}

.answer-myth {
  background: #f7c948;
  color: #111;
}

.answer-fact {
  background: #343434;
  color: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.myth-reveal {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.result-banner {
  display: inline-flex;
  align-items: center;
  margin-bottom: 18px;
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
}

.result-banner.correct {
  background: rgba(76, 175, 80, 0.16);
  color: #91e39a;
}

.result-banner.wrong-answer {
  background: rgba(255, 107, 107, 0.16);
  color: #ffb1b1;
}

.myth-citation {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: clamp(13px, 1.3vw, 15px);
  line-height: 1.5;
}

.citation-label {
  display: block;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 4px;
}

.citation-link {
  color: #f7c948;
  text-decoration: none;
  word-break: break-word;
}

.citation-link:hover {
  text-decoration: underline;
}

.myth-share {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.myth-share-label {
  font-size: 13px;
  font-weight: 700;
  color: #d8d8d8;
  margin-right: 2px;
}

.share-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #2d2d2d;
  color: #f3f3f3;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s ease;
}

.share-btn:hover {
  background: #3a3a3a;
}

.next-wrap {
  margin-top: 20px;
}

.next-btn,
.restart-btn {
  border: none;
  border-radius: 999px;
  background: #f7c948;
  color: #111;
  padding: 13px 22px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.finish-card {
  max-width: 700px;
  margin: 20px auto 0;
  background: #232323;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 34px;
  color: #f5f5f5;
  text-align: center;
}

.finish-badge {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(247, 201, 72, 0.14);
  color: #f7c948;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 12px;
}

.finish-title {
  font-size: clamp(26px, 3vw, 36px);
  margin: 0 0 10px;
}

.finish-score {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 10px;
}

.finish-text {
  color: #d1d5db;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .game-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .myth-card {
    padding: 22px;
  }

  .game-card {
    min-height: 380px;
  }

  .myth-card-title {
    font-size: 22px;
  }

  .myth-row {
    font-size: 16px;
  }

  .answer-buttons {
    width: 100%;
  }

  .answer-btn {
    flex: 1 1 160px;
  }
}
</style>