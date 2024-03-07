<template>
  <v-card class="d-flex flex-column justify-center mt-1 pa-2">
    <v-card-title class="mx-auto">Modify theme</v-card-title>
    <span
      ><v-color-picker
        v-model="colorPicker"
        class="mx-auto mb-2"
        canvas-height="140"
        hide-inputs
      ></v-color-picker
    ></span>
    <span
      ><v-text-field
        v-model="colorPicker"
        label="Hexcode"
        placeholder="Add hexcode manually"
        variant="outlined"
      ></v-text-field
    ></span>
    <v-btn color="tertiary" @click="changeColor(theme.global.name.value, colorPicker, 'tertiary')"
      >Primary
      <template #append>
        <v-icon
          v-show="tertiaryColorChanged"
          color="success"
          class="animate__animated animate__heartBeat"
          >fas fa-check</v-icon
        >
      </template>
    </v-btn>

    <v-btn
      class="my-2"
      color="secondary"
      @click="changeColor(theme.global.name.value, colorPicker, 'secondary')"
      >Secondary

      <template #append>
        <v-icon
          v-show="secondaryColorChanged"
          color="success"
          class="animate__animated animate__heartBeat"
          >fas fa-check</v-icon
        >
      </template>
    </v-btn>
    <v-btn
      class="my-2"
      color="primary"
      @click="changeColor(theme.global.name.value, colorPicker, 'primary')"
      >Third
      <template #append>
        <v-icon
          v-show="primaryColorChanged"
          color="success"
          class="animate__animated animate__heartBeat"
          >fas fa-check</v-icon
        >
      </template>
    </v-btn>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn color="warning" class="mx-auto" @click="resetTheme(theme.global.name.value)"
        >Reset to default</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import 'animate.css'
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()
const theme = useTheme()
const colorPicker = ref('#7d5260')
const primaryColorChanged = ref(false)
const secondaryColorChanged = ref(false)
const tertiaryColorChanged = ref(false)

const changeColor = (themeName, color, key) => {
  // Update the color in the theme
  theme.themes.value[themeName].colors[key] = color

  // Determine which ref to update based on the key
  switch (key) {
    case 'primary':
      primaryColorChanged.value = true
      break
    case 'secondary':
      secondaryColorChanged.value = true
      break
    case 'tertiary':
      tertiaryColorChanged.value = true
      break
    default:
      break
  }
  const storeThemeName = themeName === 'myCustomDarkTheme' ? 'customDarkTheme' : 'customLightTheme'
  store.changeColor({
    theme: storeThemeName,
    color: color,
    key: key
  })
  window.api.sendMessage('change-color', { storeThemeName, color, key })
}

const resetTheme = (themeName) => {
  // Reset the color change flags
  primaryColorChanged.value = false
  secondaryColorChanged.value = false
  tertiaryColorChanged.value = false

  // Determine the store theme name based on the current theme
  const storeThemeName = themeName === 'myCustomDarkTheme' ? 'customDarkTheme' : 'customLightTheme'

  // Reset the colors based on the theme
  if (themeName === 'myCustomDarkTheme') {
    theme.themes.value[themeName].colors.primary = '#80d0ff'
    theme.themes.value[themeName].colors.secondary = '#374955'
    theme.themes.value[themeName].colors.tertiary = '#f3dbc5'
  } else {
    theme.themes.value[themeName].colors.primary = '#1E4A7D'
    theme.themes.value[themeName].colors.secondary = '#F1EDF1'
    theme.themes.value[themeName].colors.tertiary = '#7d5260'
  }

  // Update the store
  store.resetColors(storeThemeName)
  window.api.sendMessage('reset-color', { storeThemeName })
}
</script>

<style scoped>
body {
  overflow: hidden;
}
</style>
