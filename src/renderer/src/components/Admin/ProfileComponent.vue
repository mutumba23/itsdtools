<template>
<v-snackbar
    v-model="showSnackbar"
    :timeout="3000"
    color="secondary"
    location="top"
    rounded="pill"
  >
    {{ snackbarText }}
  </v-snackbar>

  <v-sheet v-if="store.storeUser" style="height: 90vh">
    <v-card flat class="pa-2 mt-2 show-scrollbar container" style="height: 100%">
      <v-card-title>Profile</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="storeUser.displayName"
              label="Display Name"
              outlined
              dense
            >
            <template #append-inner>
              <v-btn size="small" @click="handleDisplayNameChange">Update</v-btn>
            </template>
          </v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="storeUser.email"
              label="Email"
              outlined
              dense
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-alert v-if="emailSent" type="info">Verification email has been sent to {{ storeUser.email }}. Verification is pending. Please notice that if you resend the email the link from the first email will expire.</v-alert>
      <v-card-actions>
        <v-btn v-if="!storeUser.emailVerified" @click="handleSendVerificationEmail">
          <span v-if="!emailSent">Verify email</span><span v-else>Resend verification email</span>
        </v-btn>
        <v-btn color="error" @click="handleSignout">Sign out</v-btn>
      </v-card-actions>
    </v-card>
  </v-sheet>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMyStore } from '@/stores/items.js'
import { signout, sendVerificationEmail, updateDisplayName } from '../../firebase.js'
const store = useMyStore()
const storeUser = computed(() => store.user);
const emailSent = computed(() => store.emailSent);
const showSnackbar = ref(false)
const snackbarText = ref('')


const handleSignout = () => {
  window.api.sendMessage("user-logged-out")
  window.api.sendMessage("minimize-winSettings")
  signout();
};

const handleDisplayNameChange = () => {
  updateDisplayName(storeUser.value.displayName)
    .then(() => {
      showSnackbar.value = true
      snackbarText.value = 'Display name updated'
    })
    .catch((error) => {
      console.error('Error updating display name:', error);
    });
};

const handleSendVerificationEmail = () => {
  sendVerificationEmail()
    .then(() => {
      store.emailSent = true;
      console.log("Verification email sent")
    })
    .catch((error) => {
      console.error('Error sending verification email:', error);
    });
};


</script>
