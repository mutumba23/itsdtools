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
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router';
import { handleAuthStateChange } from './firebase.js'
import 'animate.css';
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

const navigateRouteHandler = (data) => {
  router.push(data);
}

const colorChangedHandler = (data) => {
  const { storeThemeName, color, key } = data;
    store.changeColor({
        theme: storeThemeName,
        color: color,
        key: key,
      });
      setCustomColors("customDarkTheme", "myCustomDarkTheme");
      setCustomColors("customLightTheme", "myCustomLightTheme");
}

const colorResetHandler = (data) => {
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
}

const toggleThemeHandler = (data) => {
  theme.global.name.value =
    theme.global.name.value === "myCustomLightTheme"
      ? "myCustomDarkTheme"
      : "myCustomLightTheme";
  const themeName = data;
  theme.global.name.value = themeName;
  store.setTheme(themeName);
}

const configDoneHandler = (data) => {
  store.SET_CONFIG_DONE(data);
}

/*const addCustomLinkHandler = (data) => {
  store.addCustomLink(data);
}

const removeCustomLinkHandler = (data) => {
  store.removeCustomLink(data);
}*/

const updateBrowserIconCustomLinkHandler = (data) => {
  store.updateBrowserIconCustomLink(data);
}

const minimizeWinSettingsHandler = () => {
  store.settingsOverlay = false;
  console.log("closed")
}

const settingsOverlayHandler = (data) => {
  store.settingsOverlay = data;
}

const userLoggedInHandler = (data) => {
  store.setUserLoggedIn(true)
  store.setUser(data)
}

const userLoggedOutHandler = () => {
  store.setUserLoggedIn(false)
  store.clearUser()
}


///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(() => {
  theme.global.name.value = store.theme;
  setCustomColors("customDarkTheme", "myCustomDarkTheme");
  setCustomColors("customLightTheme", "myCustomLightTheme");

  window.api.addEventListener('navigate-route', navigateRouteHandler)
  window.api.addEventListener('color-changed', colorChangedHandler)
  window.api.addEventListener('color-reset', colorResetHandler)
  window.api.addEventListener("toggle-theme", toggleThemeHandler)
  window.api.addEventListener("configDone", configDoneHandler)
 // window.api.addEventListener("addCustomLink", addCustomLinkHandler)
  //window.api.addEventListener("removeCustomLink", removeCustomLinkHandler)
  window.api.addEventListener("updateBrowserIconCustomLink", updateBrowserIconCustomLinkHandler)
  window.api.addEventListener("minimize-winSettings", minimizeWinSettingsHandler)
  window.api.addEventListener("settingsOverlay", settingsOverlayHandler)
  window.api.addEventListener('user-logged-in', userLoggedInHandler)
  window.api.addEventListener('user-logged-out', userLoggedOutHandler)

  handleAuthStateChange((user) => {
    if (user) {
      // User is logged in
      const userDetails = {
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        uid: user.uid,
      }
      store.setUser(userDetails)
      store.setUserLoggedIn(true)
      window.api.sendMessage("user-logged-in", userDetails)
      console.log("user logged in")
    } else {
      // No user logged in
      store.clearUser()
      store.setUserLoggedIn(false)
      window.api.sendMessage("user-logged-out")
      console.log("user logged out")
    }
  })
});

onBeforeUnmount(() => {
  window.api.removeEventListener('navigate-route', navigateRouteHandler)
  window.api.removeEventListener('color-changed', colorChangedHandler)
  window.api.removeEventListener('color-reset', colorResetHandler)
  window.api.removeEventListener("toggle-theme", toggleThemeHandler)
  window.api.removeEventListener("configDone", configDoneHandler)
 // window.api.removeEventListener("addCustomLink", addCustomLinkHandler)
 // window.api.removeEventListener("removeCustomLink", removeCustomLinkHandler)
  window.api.removeEventListener("updateBrowserIconCustomLink", updateBrowserIconCustomLinkHandler)
  window.api.removeEventListener("minimize-winSettings", minimizeWinSettingsHandler)
  window.api.removeEventListener("settingsOverlay", settingsOverlayHandler)
  window.api.removeEventListener('user-logged-in', userLoggedInHandler)
  window.api.removeEventListener('user-logged-out', userLoggedOutHandler)
})
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