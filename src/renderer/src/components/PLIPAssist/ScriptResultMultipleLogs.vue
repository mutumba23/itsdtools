<template>
  <v-card flat class="ma-2 mt-8">
    <v-card-title>Script result</v-card-title>
    <v-alert v-if="chosenScript.scriptMessage.length > 0" type="success" class="mt-2">
      Script executed successfully
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
    <v-alert v-else type="error" class="mt-2">
      Script failed
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

    <v-expansion-panels class="mt-2">
      <v-expansion-panel v-if="chosenScript.scriptMessage.length > 0">
        <v-expansion-panel-title>
          <v-chip class="mr-2">{{ chosenScript.scriptMessage.length }}</v-chip>
          Success logs
        </v-expansion-panel-title>
        <v-expansion-panel-text
          v-for="(message, index) in chosenScript.scriptMessage"
          :key="`error-${index}`"
        >
          <v-alert type="success" class="pa-1">
            {{ message }}
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="chosenScript.scriptError.length > 0">
        <v-expansion-panel-title>
          <v-chip class="mr-2">{{ chosenScript.scriptError.length }}</v-chip>
          Error logs
        </v-expansion-panel-title>
        <v-expansion-panel-text
          v-for="(error, index) in chosenScript.scriptError"
          :key="`error-${index}`"
        >
          <v-alert type="error" class="pa-1">
            {{ error }}
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

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
