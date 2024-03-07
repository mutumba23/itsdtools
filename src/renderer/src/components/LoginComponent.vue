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

  <v-card flat class="pa-2 mt-2">
    <v-card-title v-if="errorMessage != null"
      ><v-alert type="error">Login failed</v-alert></v-card-title
    >
    <v-card-title v-else class="text-center">Login</v-card-title>
    <span
      ><v-form v-model="form" @submit.prevent="onSubmit">
        <v-text-field
          v-model="email"
          :readonly="loading"
          hide-details="auto"
          label="Email address"
          placeholder="johndoe@gmail.com"
          type="email"
          clearable
          :rules="[required, emailRule]"
          class="mb-2"
        ></v-text-field>

        <v-text-field
          v-model="password"
          :readonly="loading"
          label="Password"
          placeholder="Your app specific password"
          type="password"
          clearable
          :rules="[required]"
        ></v-text-field>

        <v-btn
          :disabled="!password"
          :loading="loading"
          block
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          @click="handleLogin(email, password)"
        >
          Sign In
        </v-btn>
      </v-form>
    </span>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn :disabled="!isEmailValid" text @click="handleResetPassword">Forgot Password?</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { login, resetPassword } from '../firebase.js'
import { ref, computed } from 'vue'
const form = ref(false)
const email = ref('')
const password = ref(null)
const loading = ref(false)
const errorMessage = ref(null)
const showSnackbar = ref(false)
const snackbarText = ref('')
const required = (v) => !!v || 'Field is required'
const emailRule = (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
const isEmailValid = computed(() => {
  return emailRule(email.value) === true
})

const onSubmit = () => {
  if (!form.value) return

  loading.value = true

  setTimeout(() => (loading.value = false), 2000)
}

const handleLogin = (email, password) => {
  login(email, password);
  window.api.sendMessage('authenticate-user')
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
    errorMessage.value = 'Error sending password reset email. Please try again later.'
    showSnackbar.value = true;
    snackbarText.value = 'Error sending password reset email. Please try again later.'
  }
};
</script>
