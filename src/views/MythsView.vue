<script setup>
import { ref } from 'vue'

const myths = [
  {
    title: '☁️ Myth 1: Cloudy means safe',
    wrong: '"If it’s cloudy, UV exposure is low."',
    right: 'Cloud cover does not remove UV risk. UV can still be high enough to damage skin.',
    citation: 'Connect your own real citations here once your content is ready.'
  },
  {
    title: '🏖️ Myth 2: Sunscreen is only for the beach',
    wrong: '"Daily commuting doesn’t need sun protection."',
    right: 'Everyday outdoor exposure can still contribute to cumulative skin damage.',
    citation: 'Add your paper, journal, or public health source here.'
  },
  {
    title: '🌞 Myth 3: A tan is healthy',
    wrong: '"A tan is a sign of strong, healthy skin."',
    right: 'Tanning is a biological response to DNA damage caused by UV radiation.',
    citation: 'Replace with the citation block you plan to use in the final version.'
  }
]

/** Build shareable text for a myth (title + short summary). */
function getShareText(myth) {
  return `${myth.title}\n\nMyth: ${myth.wrong}\nFact: ${myth.right}`
}

/** Current page URL for “Copy link” and social share fallbacks. */
function getShareUrl() {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

/** Prefer copy on desktop to avoid browser "couldn't show share" modal; use Web Share only on mobile. */
function isLikelyMobile() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  return (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0) || window.innerWidth <= 768
}

/** Use Web Share API only on mobile; otherwise always copy text to clipboard (reliable, no modal). */
async function shareWithNative(myth, cardIndex) {
  const text = getShareText(myth)
  const url = getShareUrl()
  const useNativeShare = isLikelyMobile() && typeof navigator !== 'undefined' && navigator.share
  if (useNativeShare) {
    try {
      await navigator.share({
        title: myth.title,
        text: text.replace(/\n/g, ' ').slice(0, 200),
        url
      })
      showCopied(`share-${cardIndex}`)
      return
    } catch (e) {
      if (e.name === 'AbortError') return
      // Fallback to copy on any other error so the button still does something useful
    }
  }
  await copyToClipboard(text)
  showCopied(`share-${cardIndex}`)
}

/** Open Twitter/X share in new tab. */
function shareToTwitter(myth) {
  const text = `${myth.title} – Sun safety facts from Australia's Sun Risk in Plain Sight`
  const url = getShareUrl()
  const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

/** Open Facebook share in new tab. */
function shareToFacebook(myth) {
  const url = getShareUrl()
  const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

/** Open LinkedIn share in new tab. */
function shareToLinkedIn(myth) {
  const url = getShareUrl()
  const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(u, '_blank', 'noopener,noreferrer')
}

/** Copy myth text to clipboard. */
async function copyMythText(myth) {
  await copyToClipboard(getShareText(myth))
}

/** Copy current page URL to clipboard. */
async function copyLink() {
  await copyToClipboard(getShareUrl())
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

const copiedLabel = ref(null)

function showCopied(id) {
  copiedLabel.value = id
  setTimeout(() => { copiedLabel.value = null }, 1500)
}
</script>

<template>
  <div class="page-content">
    <div class="myths-wrap">
      <div class="section-heading" style="margin-bottom: 20px">
        <span class="section-number">03</span>
        <span class="section-dot"></span>
        Common Sun Safety Myths
      </div>
      <div class="myths-grid">
        <div v-for="(myth, i) in myths" :key="i" class="myth-card">
          <div class="myth-card-title">{{ myth.title }}</div>
          <div class="myth-row">
            <div class="badge x">✗</div>
            <div>{{ myth.wrong }}</div>
          </div>
          <div class="myth-row">
            <div class="badge ok">✓</div>
            <div>{{ myth.right }}</div>
          </div>
          <div class="myth-citation">{{ myth.citation }}</div>
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
              @click="shareToFacebook(myth)"
            >
              FB
            </button>
            <button
              type="button"
              class="share-btn"
              title="Share on LinkedIn"
              @click="shareToLinkedIn(myth)"
            >
              In
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
</template>
