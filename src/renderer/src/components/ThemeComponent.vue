<template>
  <v-card class="d-flex flex-column justify-center mt-1 pa-2">
    <v-select
      v-model="selectedTheme"
      :items="allThemes"
      density="compact"
      item-title="name"
      item-value="name"
      return-object
      label="Select Theme"
      :bg-color="theme.themes.value[theme.global.name.value].colors.tertiary"
    ></v-select>
    <v-card-subtitle class="mx-auto">Customize app colors</v-card-subtitle>
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
    <v-btn color="tertiary" @click="changeColor(theme.global.name.value, colorPicker, 'tertiary', true)"
      >Primary {{ theme.themes.value[theme.global.name.value].colors.tertiary }}
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
      @click="changeColor(theme.global.name.value, colorPicker, 'secondary', true)"
      >Secondary {{ theme.themes.value[theme.global.name.value].colors.secondary }}

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
      @click="changeColor(theme.global.name.value, colorPicker, 'primary', true)"
      >Third {{ theme.themes.value[theme.global.name.value].colors.primary }}
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
import { ref, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()
const theme = useTheme()
const colorPicker = ref('#7d5260')
const primaryColorChanged = ref(false)
const secondaryColorChanged = ref(false)
const tertiaryColorChanged = ref(false)
const myCustomDarkTheme = computed(() => store.myDarkThemeTemplate);
const myCustomLightTheme = computed(() => store.myLightThemeTemplate);

const darkThemes = [
  {
    name: 'Dark - Default',
    colors: {
      primary: '#80d0ff',
      secondary: '#374955',
      tertiary: '#f3dbc5'
    }
  },
  {
    name: 'Dark - Blue',
    colors: {
      primary: '#80d0ff',
      secondary: '#374955',
      tertiary: '#0d2f48'
    }
  },
  {
    name: 'Dark - Green',
    colors: {
      primary: '#4CAF50',
      secondary: '#374955',
      tertiary: '#4CAF50'
    }
  },
  {
    name: 'Dark - Purple',
    colors: {
      primary: '#C73EDE',
      secondary: '#374955',
      tertiary: '#C73EDE'
    }
  },
  {
    name: 'Dark - Teal',
    colors: {
      primary: '#009688',
      secondary: '#374955',
      tertiary: '#009688'
    }
  },
];

const lightThemes = [
  {
    name: 'Light - Default',
    colors: {
      primary: '#1E4A7D',
      secondary: '#F1EDF1',
      tertiary: '#7d5260'
    }
  },
  {
    name: 'Light - Navy (AIK Blue)',
    colors: {
      primary: '#0d2f48',
      secondary: '#f5f9fb',
      tertiary: '#0d2f48'
    }
  },
  {
    name: 'Light - Green',
    colors: {
      primary: '#1B5E20',
      secondary: '#F0FBF1',
      tertiary: '#4CAF50'
    }
  },
  {
    name: 'Light - Purple',
    colors: {
      primary: '4A148C',
      secondary: '#FCE9FF',
      tertiary: '#9C27B0'
    }
  },
  {
    name: 'Light - Teal',
    colors: {
      primary: '#004D40',
      secondary: '#E5FBF9',
      tertiary: '#009688'
    }
  }
];

const allThemes = computed(() => {
  return theme.global.name.value === 'myCustomDarkTheme'
    ? [...darkThemes, myCustomDarkTheme.value]
    : [...lightThemes, myCustomLightTheme.value];
});

let selectedTheme = ref(null);

const changeColor = (themeName, color, key, customColorChosen) => {
  // Update the color in the theme
  theme.themes.value[themeName].colors[key] = color

  if(customColorChosen){
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
    const themeTemplate = themeName === 'myCustomDarkTheme' ? store.myDarkThemeTemplate : store.myLightThemeTemplate;
    themeTemplate.colors.primary = theme.themes.value[themeName].colors.primary;
    themeTemplate.colors.secondary = theme.themes.value[themeName].colors.secondary;
    themeTemplate.colors.tertiary = theme.themes.value[themeName].colors.tertiary;
    selectedTheme.value = themeTemplate.name;
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
    colorPicker.value = '#f3dbc5'
  } else {
    theme.themes.value[themeName].colors.primary = '#1E4A7D'
    theme.themes.value[themeName].colors.secondary = '#F1EDF1'
    theme.themes.value[themeName].colors.tertiary = '#7d5260'
    colorPicker.value = '#7d5260'
  }

  selectedTheme.value = null

  // Update the store
  store.resetColors(storeThemeName)
  window.api.sendMessage('reset-color', { storeThemeName })
}

watch(selectedTheme, (newTheme) => {
  if (typeof newTheme === 'object' && newTheme !== null) {
    for (const colorKey in newTheme.colors) {
      changeColor(theme.global.name.value, newTheme.colors[colorKey], colorKey);
    }
    colorPicker.value = newTheme.colors.tertiary;
    if(!newTheme.custom){
      primaryColorChanged.value = false;
      secondaryColorChanged.value = false;
      tertiaryColorChanged.value = false;
    } 
  }
});

watch(theme.global.name, () => {
  // Update selectedTheme when the global theme changes
  selectedTheme.value = null;
});

</script>

<style scoped>
body {
  overflow: hidden;
}

</style>
