<template>
  <v-layout>
    <v-app class="bg-transparent">
      <v-main>
        <router-view />
      </v-main>
    </v-app>
  </v-layout>
</template>

<script setup>
import { useMyStore } from '@/stores/items.js'
import { useTheme } from "vuetify";
import { onMounted } from 'vue'
import { useRouter } from 'vue-router';
const theme = useTheme()
const store = useMyStore() 
const router = useRouter();

const setCustomColors = (customTheme, myCustomTheme) => {
      const themes = theme.themes.value;

      if (!store[customTheme]) {
        console.error(`Could not find custom theme: ${customTheme}`);
        return;
      }

      if (!themes[myCustomTheme] || !themes[myCustomTheme].colors) {
        console.error(`Could not find myCustomTheme: ${myCustomTheme}`);
        return;
      }

      Object.entries(store[customTheme]).forEach(([key, value]) => {
        if (value) {
          themes[myCustomTheme].colors[key] = value;
        }
      });
};


///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(() => {
  theme.global.name.value = store.theme;
  setCustomColors("customDarkTheme", "myCustomDarkTheme");
  setCustomColors("customLightTheme", "myCustomLightTheme");

  window.api.addEventListener("navigate-route", (data) => {
    router.push(data);
  });

  window.api.addEventListener("color-changed", (data) => {
    const { storeThemeName, color, key } = data;
    store.changeColor({
        theme: storeThemeName,
        color: color,
        key: key,
      });
      setCustomColors("customDarkTheme", "myCustomDarkTheme");
      setCustomColors("customLightTheme", "myCustomLightTheme");
  });
  window.api.addEventListener("color-reset", (data) => {
    const themeName =
        data.storeThemeName === "customDarkTheme"
          ? "myCustomDarkTheme"
          : "myCustomLightTheme";
      if (themeName === "myCustomDarkTheme") {
        theme.themes.value[themeName].colors.primary = "#80d0ff";
        theme.themes.value[themeName].colors.secondary = "#374955";
        theme.themes.value[themeName].colors.tertiary = "#f3dbc5";
      } else {
        theme.themes.value[themeName].colors.primary = "#1E4A7D";
        theme.themes.value[themeName].colors.secondary = "#F1EDF1";
        theme.themes.value[themeName].colors.tertiary = "#7d5260";
      }
      store.resetColors(data.storeThemeName);
  });

  window.api.addEventListener("toggle-theme", (data) => {
    theme.global.name.value =
        theme.global.name.value === "myCustomLightTheme"
          ? "myCustomDarkTheme"
          : "myCustomLightTheme";
      const themeName = data;
      theme.global.name.value = themeName;
      store.setTheme(themeName);
  });

  window.api.addEventListener("configDone", (data) => {
    store.SET_CONFIG_DONE(data);
  });

  window.api.addEventListener("addCustomLink", (data) => {
    store.addCustomLink(data);
  });

  window.api.addEventListener("removeCustomLink", (data) => {
    store.removeCustomLink(data);
  });

  window.api.addEventListener("updateBrowserIconCustomLink", (data) => {
    store.updateBrowserIconCustomLink(data);
  });

  window.api.addEventListener("minimize-winSettings", () => {
    store.settingsOverlay = false;
  });

  window.api.addEventListener("settingsOverlay", (data) => {
    store.settingsOverlay = data;
  });
});
//Mounted END
///////////////////////////////////////////////////
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.drag {
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}

span {
  -webkit-app-region: no-drag;
}

.switch {
  -webkit-app-region: no-drag;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

html,
body {
  overflow-y: hidden;
  background: transparent;
}

*:not(.show-scrollbar)::-webkit-scrollbar {
  display: none;
}

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
  content: "";
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

.chat-container {
  overflow-y: visible;
}
</style>