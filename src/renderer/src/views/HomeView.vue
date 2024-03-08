<template>
    <v-dialog v-model="store.showAbout" fullscreen>
      <AboutView />
    </v-dialog>
    <AppBarComponent />
    <HomeComponent  />
  </template>
  
  <script setup>  
  import AppBarComponent from '@/components/AppBarComponent.vue'
  import HomeComponent from '@/components/HomeComponent.vue'
  import AboutView from './AboutView.vue'
  import { useMyStore } from '@/stores/items.js'
  const store = useMyStore()

  </script>
  