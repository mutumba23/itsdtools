<template>
  <v-app-bar density="compact" color="tertiary" rounded class="drag">
    <v-app-bar-title>ITSD Tools</v-app-bar-title>
    <template #prepend>
      <v-btn color="on-tertiary" icon="fas fa-gear" @click="openSettings"></v-btn>
      <v-btn color="on-tertiary" icon="fas fa-info" @click="openAbout"></v-btn>
    </template>
    
    <template #append>
      <v-btn
        color="on-tertiary"
        :class="isPinnedClass"
        icon="fas fa-thumbtack"
        @click="toggleAlwaysOnTop"
      ></v-btn>
      <v-btn
        color="on-tertiary"
        icon="fas fa-window-minimize"
        @click="minimize"
      ></v-btn>
      <v-btn color="on-tertiary" icon="fas fa-xmark" @click="closeApp"></v-btn>
    </template>
  </v-app-bar>
  <v-snackbar
    v-model="snackbar"
    :timeout="2000"
    color="secondary"
    location="bottom"
    contained
    close-on-content-click
  >
    <v-icon>fas fa-thumbtack</v-icon>
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { useMyStore } from '@/stores/items.js'
import { ref, onMounted, computed } from 'vue'
    const store = useMyStore() // Access Pinia store
    const snackbar = ref(false);
    const snackbarText = ref('');

    onMounted(() => {
      if (store.isPinned) {
        window.api.toggleAlwaysOnTop(true)
      }
    });

    const isPinnedClass = computed(() => {
      return store.isPinned ? 'bg-secondary' : ''
    })

    const toggleAlwaysOnTop = () => {
      store.toggleIsPinned(); // Toggle isPinned state using the action
      const newValue = store.isPinned; // Get the updated value from the store
      const snackbarText = newValue ? 'Window pinned' : 'Window unpinned';
      openSnackbar(snackbarText);
      window.api.sendMessage('toggle-always-on-top', newValue);
    };

    const openSnackbar = (text) => {
      // Set the snackbar text
      snackbarText.value = text;
      // Open the snackbar
      snackbar.value = true;
    };

    const closeApp = () => {
      window.api.sendMessage('quit-app');
    }

    const openSettings = () => {
      window.api.sendMessage('open-settings')
      store.settingsOverlay = true;
    }

    const openAbout = () => {
      window.api.sendMessage('open-about')
    }

    const minimize = () => {
      window.api.sendMessage('minimize')
    }
</script>



<style>
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #374955;
}

input:focus + .slider {
  box-shadow: 0 0 1px #374955;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}
/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
