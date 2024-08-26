<template>
  <!--Snackbar--><v-snackbar
    v-model="showSnackbar"
    :timeout="3000"
    color="secondary"
    location="bottom"
  >
    {{ snackbarText }}
  </v-snackbar>
  <v-card flat class="pa-2 mt-2">
    <v-card-title class="text-center">Add custom link</v-card-title>
    <v-form v-model="form" @submit.prevent="onSubmit">
      <span
        ><v-text-field
          v-model="linkName"
          :readonly="loading"
          hide-details="auto"
          label="Link name"
          clearable
          :rules="[(v) => (v && v.length <= 28) || 'Maximum 28 characters allowed']"
          class="mb-2"
        ></v-text-field>
        <v-text-field
          v-model="url"
          :readonly="loading"
          hide-details="auto"
          placeholder="https://example.com"
          :rules="[
            (v) => !!v || 'Field is required',
            (v) =>
              v.startsWith('https://') ||
              v.startsWith('http://') ||
              'URL must start with http:// or https://',
            (v) => isValidDomain(v) || 'Invalid domain'
          ]"
          label="URL"
          clearable
          class="mb-2"
        ></v-text-field>
        <v-checkbox v-model="incognito" color="tertiary" label="Incognito"></v-checkbox>
      </span>
      <v-btn
        :disabled="!form"
        :loading="loading"
        block
        color="success"
        size="large"
        type="submit"
        variant="elevated"
        class="mb-2"
        @click="addCustomLink"
      >
        Add custom link
      </v-btn>
    </v-form>
  </v-card>

  <!--List custom links and remove button-->
  <v-card v-if="customLinks.length > 0" flat class="pb-4 custom-links-card show-scrollbar">
    <v-card-title>Your customs links</v-card-title>
    <v-row v-for="(button, id) in customLinks" :key="id" class="flex-nowrap">
      <v-btn
        class="ml-4 flex-grow-1 justify-start"
        color="on-tertiary"
        :style="{ textTransform: 'none' }"
        size="large"
        :prepend-icon="button.incognito ? 'fas fa-mask' : 'fas fa-link'"
        variant="text"
        @click="openExternalLink(button.link, button.browserIcon)"
      >
        {{ button.name }}
      </v-btn>

      <span class="d-flex mr-2"
        ><v-icon color="primary" class="align-self-center" @click="changeBrowser(button.id)">{{
          button.browser
        }}</v-icon></span
      >
      <span class="d-flex">
        <v-icon
          color="error"
          size="small"
          class="mr-5 align-self-center"
          @click="removeCustomLink(button.id)"
          >fas fa-trash</v-icon
        ></span
      >
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMyStore } from '@/stores/items.js'
import { addCustomLinkFirebase, removeCustomLinkFirebase, getDocumentFromCollection } from '../firebase.js'
const store = useMyStore()
const showSnackbar = ref(false)
const incognito = ref(false)
const form = ref(false)
const loading = ref(false)
const snackbarText = ref('')
const url = ref('')
const linkName = ref('')
const userCustomLinks = ref([])

const customLinks = computed(() => {
  return userCustomLinks.value ? userCustomLinks.value : [];
})
const onSubmit = () => {
  if (!form.value) return

  loading.value = true

  setTimeout(() => {
    loading.value = false
    showSnackbar.value = true
    snackbarText.value = 'Custom link added'
  }, 500)
}
const addCustomLink = async () => {
  let icon = 'fab fa-edge'
  if (incognito.value) {
    icon = 'fas fa-mask'
  }
  let newLink = {
    name: linkName.value,
    icon: icon,
    browser: 'fab fa-edge',
    link: url.value,
    incognito: incognito.value
  }
  //store.addCustomLink(newLink) //Uncomment to use Pinia store
  await addCustomLinkFirebase(store.user.uid, newLink)
    .then(async () => {
      window.api.sendMessage('addCustomLink', newLink)
      const customLinks = await fetchUserArray('customLinks');
      userCustomLinks.value = customLinks;
    });
}
const removeCustomLink = async (id) => {
  await removeCustomLinkFirebase(store.user.uid, id)
    .then(async () => {
      window.api.sendMessage('removeCustomLink', id)
      const customLinks = await fetchUserArray('customLinks');
      userCustomLinks.value = customLinks;
    });
  //Uncomment below to use Pinia store instead
  //window.api.sendMessage('removeCustomLink', index)
  //store.removeCustomLink(index)
  //snackbarText.value = 'Custom link removed'
}
const changeBrowser = (index) => {
  window.api.sendMessage('updateBrowserIconCustomLink', index)
  store.updateBrowserIconCustomLink(index)
}
function isValidDomain(url) {
  // Extract the domain from the URL
  const domain = url.match(/^https?:\/\/([^/?#]+)/i)?.[1]
  if (!domain) return false

  // Validate the domain (simple example)
  // You can replace this with a more comprehensive domain validation logic
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)
}
const fetchUserArray = async (arrayName) => {
  const userDoc = await getDocumentFromCollection('users', store.user.uid);
  if (userDoc) {
    // Use arrayName to access the desired array
    return userDoc[arrayName];
  } else {
    console.log('No such document!');
    return null;
  }
}

///////////////////////Mounted////////////
onMounted(async () => {
  const customLinks = await fetchUserArray('customLinks');
  userCustomLinks.value = customLinks;
})

//////////////////////////////////////////
</script>

<style scoped>
.custom-links-card {
  max-height: 290px; /* Adjust the height as needed */
  overflow-y: auto;
}
</style>
