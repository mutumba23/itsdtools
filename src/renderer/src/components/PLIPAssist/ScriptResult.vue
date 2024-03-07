<template>
  <v-card flat class="ma-2 mt-8">
    <v-card-title>Script result</v-card-title>
    <v-card-text v-if="chosenScript.scriptMessage && chosenScript.scriptMessage.length > 0">
      <div v-for="(message, index) in chosenScript.scriptMessage" :key="index">
        <v-alert v-if="message" type="success" class="mt-2">
          {{ message }}
          <v-tooltip text="Copy all logs to the clipboard">
            <template #activator="{ tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                variant="plain"
                class="float-right"
                color="white"
                icon="fas fa-copy"
                @click="copyLogsToClipboard"
              ></v-btn>
            </template>
          </v-tooltip>
        </v-alert>
      </div>
    </v-card-text>
    <v-card-text v-if="chosenScript.scriptError && chosenScript.scriptError.length > 0">
      <div v-for="(error, index) in chosenScript.scriptError" :key="`error-${index}`">
        <v-alert v-if="error" type="error" class="mt-2">
          {{ error }}
          <v-tooltip text="Copy all logs to the clipboard">
            <template #activator="{ tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                variant="plain"
                class="float-right"
                color="background"
                icon="fas fa-copy"
                @click="copyLogsToClipboard"
              ></v-btn>
            </template>
          </v-tooltip>
        </v-alert>
      </div>
    </v-card-text>
    <v-card-text
      v-if="
        chosenScript.scriptMessage &&
        chosenScript.scriptError &&
        chosenScript.scriptMessage.length === 0 &&
        chosenScript.scriptError.length === 0
      "
    >
      <v-alert type="info"> The script completed without any messages. </v-alert>
    </v-card-text>
    <v-chip v-if="chosenScript.lastRun" class="ma-4"
      >Script completed: {{ chosenScript.lastRun }}</v-chip
    >
  </v-card>
</template>

<script setup>
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()

const props = defineProps({
  chosenScript: {
    type: Object,
    required: true
  }
})

const copyLogsToClipboard = () => {
  const script = props.chosenScript;
  const allLogs = [...script.scriptMessage, ...script.scriptError].join('\n');
  navigator.clipboard.writeText(allLogs).then(() => {
    console.log('Logs copied to clipboard');
    store.snackbarMessage = 'Logs copied to clipboard';
    store.showGeneralSnackbar = true;
  }).catch(err => {
    console.error('Could not copy logs: ', err);
  });
}
</script>
