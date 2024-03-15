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

  <v-sheet v-if="storeUser" style="height: 90vh">
    <v-card flat class="pa-2 mt-2 show-scrollbar container" style="height: 100%">
      <v-card-text>
        <v-icon size="small" class="mr-2">fas fa-user</v-icon>{{ storeUser.email }}
      </v-card-text>
      <v-alert v-if="emailSent" type="info">Verification email has been sent to {{ storeUser.email }}. Verification is pending. Please notice that if you resend the email the link from the first email will expire.</v-alert>
      <v-card-actions>
        <v-btn v-if="!storeUser.emailVerified" @click="handleSendVerificationEmail">
          <span v-if="!emailSent">Verify email</span><span v-else>Resend verification email</span>
        </v-btn>
        <v-btn @click="handleResetPassword(storeUser.email)">Reset password</v-btn>
        <v-btn color="error" @click="handleSignout">Sign out</v-btn>
      </v-card-actions>
    </v-card>
  </v-sheet>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMyStore } from '@/stores/items.js'
import { signout, sendVerificationEmail, resetPassword } from '../../firebase.js'
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

const handleResetPassword = async (email) => {
  try {
    const result = await resetPassword(email);
    console.log(result)
    showSnackbar.value = true;
    snackbarText.value = 'Password reset email sent successfully.'
  } catch (error) {
    // Handle error
    console.error('Error sending password reset email:', error)
    showSnackbar.value = true;
    snackbarText.value = 'Error sending password reset email. Please try again later.'
  }
};


</script>
