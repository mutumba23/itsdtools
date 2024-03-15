<template>
  <div class="home">
    <v-app-bar density="compact" color="tertiary" rounded class="drag">
      <template #prepend>
        <label class="switch mr-2">
          <input
            type="checkbox"
            :checked="store.theme === 'myCustomDarkTheme'"
            @click="toggleTheme"
          />
          <span class="slider round"></span>
        </label>
        <p v-if="store.theme === 'myCustomDarkTheme'">Darkmode</p>
        <p v-else>Lightmode</p>
      </template>
      <template #append>
        <v-btn
          color="on-tertiary"
          :class="showAddcustomlinks ? 'bg-secondary' : ''"
          icon="fas fa-link"
          @click="displayAddcustomlinks"
        ></v-btn>
        <v-btn
          color="on-tertiary"
          :class="showTrashbin ? 'bg-secondary' : ''"
          icon="fas fa-trash"
          @click="displayTrashbin"
        ></v-btn>
        <v-btn
          color="on-tertiary"
          :class="showPalette ? 'bg-secondary' : ''"
          icon="fas fa-palette"
          @click="displayPalette"
        ></v-btn>
        <v-btn 
          color="on-tertiary" 
          :class="showProfile ? 'bg-secondary' : ''"
          icon="fas fa-user" 
          @click="displayProfile">
        </v-btn>
        <v-btn
          v-if="isAdmin"
          color="on-tertiary"
          :class="showAdmin ? 'bg-secondary' : ''"
          icon="fas fa-lock"
          @click="displayAdmin"
        ></v-btn>
        <v-divider vertical class="border-opacity-25"></v-divider>
        <v-btn
          color="on-tertiary"
          icon="fas fa-xmark"
          @click="sendIpcMessage('minimize-winSettings')"
        ></v-btn>
      </template>
    </v-app-bar>
    <ThemeComponent v-if="showPalette" />
    <AddcustomlinksComponent v-if="showAddcustomlinks" />
    <TrashbinComponent v-if="showTrashbin" />
    <LoginComponent v-if="!isLoggedIn && showProfile" />
    <AdminComponent v-if="isAdmin && showAdmin" />
    <ProfileComponent v-if="showProfile && isLoggedIn" />
  </div>
</template>

<script setup>
import ThemeComponent from '@/components/ThemeComponent.vue'
import AddcustomlinksComponent from '@/components/AddcustomlinksComponent.vue'
import TrashbinComponent from '@/components/TrashbinComponent.vue'
import LoginComponent from '@/components/LoginComponent.vue'
import AdminComponent from '@/components/Admin/AdminComponent.vue'
import ProfileComponent from '@/components/Admin/ProfileComponent.vue'
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()
const theme = useTheme()
const showAdmin = ref(false)
const showTrashbin = ref(false)
const showPalette = ref(false)
const isLoggedIn = ref(false)
const showAddcustomlinks = ref(true)
const showProfile = ref(false)
const storeUser = computed(() => store.user);
watch(() => store.userLoggedIn, (newValue) => {
  isLoggedIn.value = newValue;
});

const isAdmin = computed(() => {
  // Check if store.user exists and has an email property
  if (storeUser.value) {
    // Check if the logged-in user's email is included in the admins array
    return store.admins.includes(storeUser.value.email)
  } else {
    // If store.user does not exist or does not have an email property, return false
    return false
  }
})

const toggleTheme = () => {
  theme.global.name.value =
    store.theme === 'myCustomLightTheme' ? 'myCustomDarkTheme' : 'myCustomLightTheme'
  store.setTheme(theme.global.name.value)
  window.api.sendMessage('toggle-theme', theme.global.name.value)
}

const displayTrashbin = () => {
  resetAll()
  showTrashbin.value = true
  window.api.sendMessage('settings-overlay', true)
}

const displayPalette = () => {
  resetAll()
  showPalette.value = true
  window.api.sendMessage('settings-overlay', true)
}

const displayAddcustomlinks = () => {
  resetAll()
  showAddcustomlinks.value = true
  window.api.sendMessage('settings-overlay', true)
}

const displayAdmin = () => {
  resetAll()
  showAdmin.value = true
  window.api.sendMessage('settings-overlay', true)
}

const displayProfile = () => {
  resetAll()
  showProfile.value = true
  window.api.sendMessage('settings-overlay', true)
}

const resetAll = () => {
  showTrashbin.value = false
  showPalette.value = false
  showAddcustomlinks.value = false
  showAdmin.value = false
  showProfile.value = false
}

const sendIpcMessage = (message) => {
  window.api.sendMessage(message)
}

const showAddCustomLinkHandler = () => {
    displayAddcustomlinks()
}

///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(() => {
  store.UPDATE_COMMON_TOOLS()
  window.api.addEventListener('show-add-custom-link', showAddCustomLinkHandler)
  store.setTheme(theme.global.name.value)

  isLoggedIn.value = store.userLoggedIn

})

onBeforeUnmount(() => {
  window.api.removeEventListener('show-add-custom-link', showAddCustomLinkHandler)
})

//Mounted END
///////////////////////////////////////////////////
</script>
