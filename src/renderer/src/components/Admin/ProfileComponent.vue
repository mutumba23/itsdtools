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

  <v-sheet v-if="storeUser">
    <v-card flat class="pa-2 mt-2">
      <v-card-title>Profile</v-card-title>
      <v-card-text>
        <v-text-field v-model="storeUser.email" label="Email" readonly prepend-inner-icon="fas fa-envelope" ></v-text-field>
        <v-text-field v-model="storeUser.displayName" label="Display Name" prepend-inner-icon="fas fa-signature">
          <template #append-inner>
            <v-btn size="small" @click="handleDisplayName(storeUser.displayName)">Update</v-btn>
          </template>
        </v-text-field>
        <v-btn v-if="!storeUser.emailVerified && showVerifyButton" size="small" @click="handleSendVerificationEmail">
          <span v-if="!emailSent">Verify email</span><span v-else>Resend verification email</span>
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="handleResetPassword(storeUser.email)">Reset password</v-btn>
        <v-btn color="error" @click="handleSignout">Sign out</v-btn>
      </v-card-actions>
    </v-card>
  </v-sheet>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useMyStore } from '@/stores/items.js'
import { signout, sendVerificationEmail, resetPassword, updateDisplayName } from '../../firebase.js'
const store = useMyStore()
const storeUser = computed(() => store.user);
const emailSent = computed(() => store.emailSent);
const showSnackbar = ref(false)
const snackbarText = ref('')
const showVerifyButton = ref(false)


const handleSignout = () => {
  window.api.sendMessage("user-logged-out")
  window.api.sendMessage("minimize-winSettings")
  signout();
};

const handleSendVerificationEmail = () => {
  sendVerificationEmail()
    .then(() => {
      store.emailSent = true;
      showSnackbar.value = true;
      snackbarText.value = 'Verification email sent successfully.'
    })
    .catch((error) => {
      showSnackbar.value = true;
      snackbarText.value = 'Error sending verification email. Please try again later.'
      console.error('Error sending verification email:', error);
    });
};

const handleResetPassword = async (email) => {
  try {
    await resetPassword(email);
    showSnackbar.value = true;
    snackbarText.value = 'Password reset email sent successfully.'
  } catch (error) {
    // Handle error
    console.error('Error sending password reset email:', error)
    showSnackbar.value = true;
    snackbarText.value = 'Error sending password reset email. Please try again later.'
  }
};

const handleDisplayName = async (displayName) => {
  showVerifyButton.value = false
  try {
    await updateDisplayName(displayName);
    showSnackbar.value = true;
    snackbarText.value = 'Display name updated successfully.'
    if(displayName != null && displayName != '') {
      showVerifyButton.value = true
    } 
  } catch (error) {
    // Handle error
    console.error('Error updating display name:', error)
    showSnackbar.value = true;
    snackbarText.value = 'Error updating display name. Please try again later.'
  }
};

onMounted(() => {
  if(storeUser.value.displayName != null && storeUser.value.displayName != '') {
    showVerifyButton.value = true
  }
  
})


</script>
