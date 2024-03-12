<template>
    <v-dialog v-model="store.showAbout" fullscreen>
      <AboutView />
    </v-dialog>
    <AppBarComponent />
    <HomeComponent v-if="isLoggedIn"  />
    <LoginComponent v-if="!isLoggedIn" />
  </template>
  
  <script setup>  
  import AppBarComponent from '@/components/AppBarComponent.vue'
  import HomeComponent from '@/components/HomeComponent.vue'
  import LoginComponent from '@/components/LoginComponent.vue'
  import AboutView from './AboutView.vue'
  import { ref, onMounted, watch } from 'vue'
  import { useMyStore } from '@/stores/items.js'
  const store = useMyStore()
  const isLoggedIn = ref(false)

  watch(() => store.userLoggedIn, (newValue) => {
    isLoggedIn.value = newValue;
  });

  onMounted(() => {
    isLoggedIn.value = store.userLoggedIn
  })

  </script>
  