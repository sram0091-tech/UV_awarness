<script setup>
import { ref } from 'vue'
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
  }
]

const openCards = ref([])
const cardRefs = ref([])
const copiedLabel = ref(null)

function toggleMyth(index) {
  openCards.value[index] = !openCards.value[index]
}

function setCardRef(i, el) {
  if (el) cardRefs.value[i] = el
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

async function shareWithNative(myth, cardIndex) {
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
      showCopied(`share-${cardIndex}`)
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  await copyToClipboard(text)
  showCopied(`share-${cardIndex}`)
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

async function getCardImageBlob(cardIndex) {
  const el = cardRefs.value[cardIndex]
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

async function shareCardAsImage(myth, cardIndex) {
  const blob = await getCardImageBlob(cardIndex)
  if (!blob) return

  const file = new File([blob], `sun-safety-myth-${cardIndex + 1}.png`, { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: myth.title,
        text: getShareText(myth),
        files: [file]
      })
      showCopied(`share-img-${cardIndex}`)
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
  showCopied(`share-img-${cardIndex}`)
}

async function shareToInstagram(myth, cardIndex) {
  const blob = await getCardImageBlob(cardIndex)
  if (!blob) return

  const file = new File([blob], `sun-safety-myth-${cardIndex + 1}.png`, { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: myth.title,
        text: getShareText(myth),
        files: [file]
      })
      showCopied(`share-ig-${cardIndex}`)
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sun-safety-myth-${cardIndex + 1}.png`
  a.click()
  URL.revokeObjectURL(url)
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  showCopied(`share-ig-${cardIndex}`)
}

async function copyMythText(myth) {
  await copyToClipboard(getShareText(myth))
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
</script>

<template>
  <div class="page-content">
    <div class="myths-wrap">
      <div class="section-heading">
        <span class="section-number">03</span>
        <span class="section-dot"></span>
        Common Sun Safety Myths
      </div>

      <div class="myths-grid">
        <div
          v-for="(myth, i) in myths"
          :key="i"
          class="myth-card"
          :class="{ open: openCards[i] }"
          :ref="(el) => setCardRef(i, el)"
          @click="toggleMyth(i)"
        >
          <div class="myth-card-title">{{ myth.title }}</div>

          <div class="myth-row myth-only">
            <div class="badge x">✗</div>
            <div>{{ myth.wrong }}</div>
          </div>

          <div v-if="!openCards[i]" class="myth-prompt">
            Click to bust this myth
          </div>

          <div v-if="openCards[i]" class="myth-reveal" @click.stop>
            <div class="myth-row">
              <div class="badge ok">✓</div>
              <div>{{ myth.right }}</div>
            </div>

            <div class="myth-citation">
              <span class="citation-label">Source</span>

              <a
                :href="myth.citationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="citation-link"
              >
                {{ myth.citationLabel }}
              </a>
            </div>

            <div class="myth-share">
              <span class="myth-share-label">Share</span>

              <button
                type="button"
                class="share-btn"
                :title="copiedLabel === `share-${i}` ? 'Copied!' : 'Copy myth text to share'"
                @click="shareWithNative(myth, i)"
              >
                {{ copiedLabel === `share-${i}` ? 'Copied!' : 'Share' }}
              </button>

              <button
                type="button"
                class="share-btn"
                title="Share on X / Twitter"
                @click="shareToTwitter(myth)"
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
                :title="copiedLabel === `share-ig-${i}` ? 'Done!' : 'Share card image to Instagram'"
                @click="shareToInstagram(myth, i)"
              >
                {{ copiedLabel === `share-ig-${i}` ? 'OK' : 'IG' }}
              </button>

              <button
                type="button"
                class="share-btn share-btn-img"
                :title="copiedLabel === `share-img-${i}` ? 'Done!' : 'Share as card image'"
                @click="shareCardAsImage(myth, i)"
              >
                {{ copiedLabel === `share-img-${i}` ? 'Done!' : 'Image' }}
              </button>

              <button
                type="button"
                class="share-btn copy"
                :title="copiedLabel === `copy-${i}` ? 'Copied!' : 'Copy myth text'"
                @click="copyMythText(myth); showCopied(`copy-${i}`)"
              >
                {{ copiedLabel === `copy-${i}` ? 'Copied!' : 'Copy text' }}
              </button>
            </div>
          </div>
        </div>
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
  gap: 10px;
  margin-bottom: 24px;
  font-size: 20px;
  font-weight: 700;
  color: #f5f5f5;
}

.section-number {
  color: #f7c948;
  font-weight: 800;
}

.section-dot {
  width: 8px;
  height: 8px;
  background: #f7c948;
  border-radius: 50%;
}

.myths-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.myth-card {
  background: #232323;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 24px;
  color: #f1f1f1;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.myth-card:hover {
  transform: translateY(-3px);
  border-color: rgba(247, 201, 72, 0.35);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.myth-card.open {
  border-color: rgba(247, 201, 72, 0.45);
}

.myth-card-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 18px;
  line-height: 1.3;
}

.myth-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
  line-height: 1.7;
  font-size: 17px;
}

.myth-only {
  margin-bottom: 10px;
}

.badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.myth-prompt {
  margin-top: 14px;
  color: #f7c948;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.myth-reveal {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.myth-citation{
  margin-top:18px;
  padding:14px 16px;
  border-radius:12px;

  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.06);

  font-size:14px;
  line-height:1.5;
}

.citation-label{
  display:block;
  font-weight:600;
  font-size:12px;
  letter-spacing:0.04em;
  text-transform:uppercase;

  color:#9ca3af;
  margin-bottom:4px;
}

.citation-link{
  color:#f7c948;
  text-decoration:none;
  word-break:break-word;
}

.citation-link:hover{
  text-decoration:underline;
}
.myth-share {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.myth-share-label {
  font-size: 14px;
  font-weight: 700;
  color: #d8d8d8;
  margin-right: 2px;
}

.share-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #2d2d2d;
  color: #f3f3f3;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s ease;
}

.share-btn:hover {
  background: #3a3a3a;
}

.share-btn.copy,
.share-btn-img,
.share-btn-ig {
  font-weight: 600;
}

@media (max-width: 768px) {
  .myth-card {
    padding: 20px;
  }

  .myth-card-title {
    font-size: 21px;
  }

  .myth-row {
    font-size: 16px;
  }
}
</style>