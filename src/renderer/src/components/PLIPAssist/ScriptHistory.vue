<template>
  <v-sheet
    class="bg-background w-100 mx-auto d-flex flex-column flex-grow-1 py-0 px-2"
    style="height: 90vh"
  >
    <div class="show-scrollbar container" style="height: 100%">
      <v-card-title>Script History</v-card-title>
      <v-card-text
        >Five of your latest executed scripts will be displayed and the oldest will be replaced from
        the history when you run a new script.</v-card-text
      >
      <div v-if="lastRunScripts.length > 0">
        <v-expansion-panels v-for="(script, index) in lastRunScripts" :key="index">
          <v-expansion-panel
            :class="{
              'text-success': script.successMessages && script.successMessages.length > 0,
              'text-error': !script.successMessages || script.successMessages.length === 0,
              'even-panel': index % 2 === 1
            }"
          >
            <v-expansion-panel-title>
              <v-chip class="mr-2">{{ script.timestamp }}</v-chip>
              <v-chip class="mr-2">{{ script.category }}</v-chip>
              {{ script.scriptName }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat class="pa-2">
                <v-card-title>Inputs</v-card-title>
                <v-card-subtitle
                  v-if="
                    script.computerName != null &&
                    script.computerName != '' &&
                    script.mailboxes.length < 1
                  "
                  ><span class="font-weight-bold">Computer Name:</span>
                  {{ script.computerName }}</v-card-subtitle
                >
                <v-card-subtitle
                  v-if="
                    script.networkID != null &&
                    script.networkID != '' &&
                    script.mailboxes.length < 1
                  "
                  ><span class="font-weight-bold">NetworkID:</span>
                  {{ script.networkID }}</v-card-subtitle
                >
                <v-card-subtitle
                  v-if="script.email != null && script.email != '' && script.mailboxes.length < 1"
                  ><span class="font-weight-bold">User:</span> {{ script.email }}</v-card-subtitle
                >
                <v-card-subtitle
                  v-if="
                    script.mailbox != null && script.mailbox != '' && script.mailboxes.length < 1
                  "
                  ><span class="font-weight-bold">Mailbox:</span>
                  {{ script.mailbox }}</v-card-subtitle
                >
                <v-card-subtitle v-if="script.mailboxes != null && script.mailboxes.length > 0 && script.requiresAutomappingValue"
                  ><span class="font-weight-bold">Automapping:</span>
                  {{ script.automapping }}</v-card-subtitle
                >
                <v-card-subtitle v-if="script.mailboxes != null && script.mailboxes.length > 0 && script.requiresDLReplaceCheckbox"
                  ><span class="font-weight-bold">Keep existing owners:</span>
                  {{ script.keepOwners }}</v-card-subtitle
                >
                <v-expansion-panels
                  v-if="
                    (script.mailboxes != null && script.mailboxes.length > 0) ||
                    (script.users != null && script.users.length > 0)
                  "
                  class="mt-4"
                >
                  <v-expansion-panel v-if="script.users != null && script.users.length > 0">
                    <v-expansion-panel-title
                      ><span v-if="script.ownersToRemove.length > 0">Owners to add</span><span v-else>Users</span>
                      <v-chip class="ml-2">{{
                        script.users.length
                      }}</v-chip></v-expansion-panel-title
                    >
                    <v-expansion-panel-text>
                      <div class="align-start flex-column d-flex">
                        <v-chip
                          v-for="(user, userindex) in script.users"
                          :key="userindex"
                          class="mb-1 ml-2"
                        >
                          {{ user }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel v-if="script.ownersToRemove.length > 0">
                    <v-expansion-panel-title
                      >Owners to remove
                      <v-chip class="ml-2">{{
                        script.ownersToRemove.length
                      }}</v-chip></v-expansion-panel-title
                    >
                    <v-expansion-panel-text>
                      <div class="align-start flex-column d-flex">
                        <v-chip
                          v-for="(user, userindex) in script.ownersToRemove"
                          :key="userindex"
                          class="mb-1 ml-2"
                        >
                          {{ user }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel v-if="script.mailboxes != null && script.mailboxes.length > 0">
                    <v-expansion-panel-title
                      >Mailboxes/DLs
                      <v-chip class="ml-2">{{
                        script.mailboxes.length
                      }}</v-chip></v-expansion-panel-title
                    >
                    <v-expansion-panel-text>
                      <div class="align-start flex-column d-flex">
                        <v-chip
                          v-for="(mailbox, mailboxindex) in script.mailboxes"
                          :key="mailboxindex"
                          class="mb-1 ml-2"
                        >
                          {{ mailbox }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>

              <v-card
                v-if="script.successMessages.length < 3 && script.errorMessages.length < 3"
                class="bg-secondary pa-2 mt-2 d-flex flex-column"
                flat
              >
                <v-card-title>
                  Output
                  <v-tooltip text="Copy logs to the clipboard">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="plain"
                        class="float-right"
                        color="white"
                        icon="fas fa-copy"
                        @click="copyLogsToClipboard(script)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-card-title>
                <v-card-subtitle
                  >Execution time:
                  {{ (script.executionTime / 1000).toFixed(2) }} seconds</v-card-subtitle
                >
                <div
                  v-for="(message, successindex) in script.successMessages"
                  :key="successindex"
                  class="align-start flex-column d-flex"
                >
                  <v-alert v-if="message" type="success" class="mt-2">
                    {{ message }}
                  </v-alert>
                </div>
                <div
                  v-for="(message, errorindex) in script.errorMessages"
                  :key="errorindex"
                  class="align-start flex-column d-flex"
                >
                  <v-alert v-if="message" type="error" class="mt-2">
                    {{ message }}
                  </v-alert>
                </div>
              </v-card>

              <v-card v-else class="bg-secondary pa-2 mt-2">
                <v-card-title>
                  Output
                  <v-tooltip text="Copy all logs to the clipboard">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="plain"
                        class="float-right"
                        color="white"
                        icon="fas fa-copy"
                        @click="copyLogsToClipboard(script)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-card-title>
                <v-card-subtitle
                  >Execution time:
                  {{ (script.executionTime / 1000).toFixed(2) }} seconds</v-card-subtitle
                >
                <v-expansion-panels class="mt-4">
                  <v-expansion-panel v-if="script.successMessages.length > 0">
                    <v-expansion-panel-title
                      >Success Logs
                      <v-chip class="ml-2">{{
                        script.successMessages.length
                      }}</v-chip></v-expansion-panel-title
                    >
                    <v-expansion-panel-text>
                      <div
                        v-for="(message, successindex) in script.successMessages"
                        :key="successindex"
                        class="d-inline-block"
                      >
                        <v-alert v-if="message" type="success" class="mt-2">
                          {{ message }}
                        </v-alert>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  <v-expansion-panel v-if="script.errorMessages.length > 0">
                    <v-expansion-panel-title
                      >Error Logs
                      <v-chip class="ml-2">{{
                        script.errorMessages.length
                      }}</v-chip></v-expansion-panel-title
                    >
                    <v-expansion-panel-text>
                      <div
                        v-for="(message, errorindex) in script.errorMessages"
                        :key="errorindex"
                        class="d-inline-block"
                      >
                        <v-alert v-if="message" type="error" class="mt-2">
                          {{ message }}
                        </v-alert>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()

const lastRunScripts = computed(() => {
    return store.lastRunScripts;
});

const copyLogsToClipboard = (script) => {
  let allLogs = '';

      // Concatenate successMessages and errorMessages of the specific script
      allLogs += (script.successMessages || []).join('\n') + '\n';
      allLogs += (script.errorMessages || []).join('\n') + '\n';

      // Copy all logs to the clipboard
      navigator.clipboard.writeText(allLogs).then(() => {
        console.log('Logs copied to clipboard');
        store.snackbarMessage = 'Logs copied to clipboard';
        store.showGeneralSnackbar = true;
      }).catch(err => {
        console.error('Could not copy logs: ', err);
      });
};

</script>

<style scoped>
.container {
  overflow-y: auto;
  overflow-x: hidden;
}

.even-panel {
  filter: brightness(80%); /* Darken the background color by 10% */
}
</style>
