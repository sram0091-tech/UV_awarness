<script setup>
import Navbar from './components/Navbar.vue'
import TitleBlock from './components/TitleBlock.vue'
</script>

<template>
  <Navbar />
  <TitleBlock />
  <main class="page-container">
    <router-view />
  </main>
</template>
