<template>
  <!--App bar-->
  <v-app-bar density="compact" color="tertiary" class="ma-0 drag app-bar" rounded>
    <template #prepend>
      <v-app-bar-nav-icon color="on-tertiary" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title>PLIP Assist</v-app-bar-title>
    <template #append>
      <v-btn
        color="on-tertiary"
        icon="fas fa-window-minimize"
        @click="sendIpcMessage('minimize-winPLIPAssist')"
      ></v-btn>
      <v-btn
        v-if="!isMaximized"
        color="on-tertiary"
        icon="fas fa-up-right-and-down-left-from-center"
        @click="maximizeWindow()"
      ></v-btn>
      <v-btn
        v-if="isMaximized && enableMaxMinWindowButtons"
        color="on-tertiary"
        icon="fas fa-down-left-and-up-right-to-center"
        @click="restoreWindow()"
      ></v-btn>
      <v-btn
        color="on-tertiary"
        icon="fas fa-xmark"
        @click="sendIpcMessage('hide-winPLIPAssist')"
      ></v-btn>
    </template>
  </v-app-bar>

  <!--Dialog-->
  <v-dialog v-model="dialog" persistent width="auto">
    <v-card class="text-center">
      <v-card-title v-if="!dialogIsLoading">Configuration</v-card-title>
      <v-card-title v-else>Checking ExchangeOnlineManagement...</v-card-title>
      <v-card-text v-if="!dialogIsLoading">
        {{ dialogText[0] }}
      </v-card-text>
      <v-card-text v-else>
        Verifying the presence of the Exchange Online Management module. If not found, the script will proceed to install it.
        <v-progress-linear v-model="dialogValue" :buffer-value="bufferValue"></v-progress-linear>
      </v-card-text>
      <v-card-actions class="mx-auto">
        <v-btn
          v-if="!dialogInstallSuccess"
          :disabled="dialogIsLoading"
          color="primary"
          @click="runScript(13)"
          >Install</v-btn
        >
        <v-btn :disabled="dialogIsLoading" color="error" @click="closeDialog">{{
          dialogCloseText
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Snackbar - Script-->
  <v-snackbar
    v-model="showSnackbar"
    multi-line
    :timeout="200000"
    color="tertiary"
    location="bottom"
  >
    <v-icon :color="snackbarColor" class="mr-2" size="x-large">fas fa-circle-info</v-icon>
    {{ snackbarMessage }}
    <template #actions>
      <v-btn
        color="secondary"
        variant="text"
        @click="
          show('history')
        "
        >Show Script Result</v-btn
      >
      <v-btn color="secondary" variant="text" @click="showSnackbar = false">Close</v-btn>
    </template>
  </v-snackbar>

  <!--Snackbar - General-->
  <v-snackbar
    v-model="store.showGeneralSnackbar"
    :timeout="3000"
    color="tertiary"
    location="bottom"
  >
    <v-icon :color="snackbarColor" class="mr-2" size="x-large">fas fa-circle-info</v-icon>
    {{ store.snackbarMessage }}
  </v-snackbar>

  <!--Left, middle and right content-->
  <div class="d-flex flex-column h-100 py-0" style="height: 100vh">
    <!--Left menu-->
    <v-navigation-drawer v-model="drawer" class="bg-background">
      <v-list density="compact" nav>
        <v-list-item
          v-for="category in categories"
          :key="category.value"
          class="text-primary"
          :prepend-icon="category.icon"
          :title="category.title"
          :value="category.value"
          @click="show(category.value)"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!--Script menu - right side-->
    <v-navigation-drawer
      id="scriptDrawer"
      v-model="scriptDrawer"
      class="bg-background"
      location="right"
      width="500"
      @update:model-value="closeScriptDrawer"
    >
      <div style="max-height: 90vh" :class="{ 'show-scrollbar container': scriptDrawer }">
        <!--Script details-->
        <v-card v-if="!scripts[chosenScript].isLoading" flat class="ma-2">
          <v-card-title>
            {{ scripts[chosenScript].name }}
            <v-btn
              class="float-right"
              icon="fas fa-xmark"
              variant="plain"
              @click="closeScriptDrawer()"
            ></v-btn>
          </v-card-title>
          <v-card-text>{{ scripts[chosenScript].description }}</v-card-text>
          <v-text-field
            v-if="scripts[chosenScript].requiresComputer"
            v-model="computerName"
            :disabled="scripts[chosenScript].isLoading"
            label="Client"
            placeholder="Enter Computer Name"
            :rules="textFieldRulesComputer"
          ></v-text-field>
          <v-text-field
            v-if="scripts[chosenScript].requiresNetworkID"
            v-model="userName.networkID"
            :disabled="scripts[chosenScript].isLoading"
            label="NetworkID"
            placeholder="Enter NetworkID"
            :rules="textFieldRulesNetworkID"
          ></v-text-field>
          <v-text-field
            v-if="scripts[chosenScript].requiresMailbox && (!scripts[chosenScript].multipleUsers || scripts[chosenScript].requiresDisplayName)"
            v-model="mailbox"
            :disabled="scripts[chosenScript].isLoading"
            label="Shared mailbox"
            placeholder="example@inter.ikea.com"
            :rules="textFieldRulesMailbox"
          ></v-text-field>
          <v-text-field
            v-if="scripts[chosenScript].requiresMailbox && scripts[chosenScript].requiresDisplayName"
            v-model="displayName"
            :disabled="scripts[chosenScript].isLoading"
            label="Display Name"
            placeholder="Example Mailbox Name"
            :rules="textFieldRulesDisplayName"
          ></v-text-field>
          <v-text-field
            v-if="scripts[chosenScript].requiresUserEmail && !scripts[chosenScript].multipleUsers"
            v-model="userName.email"
            :disabled="scripts[chosenScript].isLoading"
            label="User email address"
            placeholder="firstname.lastname@inter.ikea.com"
            :rules="textFieldRulesMailbox"
          ></v-text-field>

          <!--Shared mailboxes text field-->
          <v-text-field
            v-if="scripts[chosenScript].multipleUsers && !scripts[chosenScript].requiresDL && !scripts[chosenScript].requiresDisplayName"
            v-model="newMailbox"
            :disabled="scripts[chosenScript].isLoading"
            autogrow
            clearable
            label="Shared mailbox address"
            placeholder="example@inter.ikea.com"
            hint="You can add multiple mailboxes. Use comma or semicolon as a separator or copy/paste from Excel cells."
            class="mb-4"
            color="primary"
            @paste="onPaste($event, mailboxes, 'mailboxes')"
            @keydown.enter.prevent="addMailbox"
            @keydown.tab="addMailbox"
            @blur="addMailbox"
          >
          <template #prepend-inner>
            <v-icon color="primary">fas fa-envelope</v-icon>
          </template>
          </v-text-field>

          <!--DL text field-->
          <v-card-text v-if="scripts[chosenScript].requiresDisplayName">Add users to grant them access to the new mailbox</v-card-text>
          <v-text-field
            v-if="scripts[chosenScript].multipleUsers && scripts[chosenScript].requiresDL"
            v-model="newMailbox"
            :disabled="scripts[chosenScript].isLoading"
            autogrow
            clearable
            label="Distribution list address"
            placeholder="example@inter.ikea.com"
            hint="You can add multiple DLs. Use comma or semicolon as a separator or copy/paste from Excel cells."
            class="mb-4"
            color="primary"
            @paste="onPaste($event, mailboxes, 'mailboxes')"
            @keydown.enter.prevent="addMailbox"
            @keydown.tab="addMailbox"
            @blur="addMailbox"
          >
          <template #prepend-inner>
            <v-icon color="primary">fas fa-envelope</v-icon>
          </template>
          </v-text-field>

          <!--Mailbox/DL - Users add text field-->
          <v-text-field
            v-if="scripts[chosenScript].multipleUsers && !scripts[chosenScript].requiresOwner"
            v-model="newUser"
            :disabled="scripts[chosenScript].isLoading || isProcessing"
            autogrow
            clearable
            label="User email address"
            placeholder="firstname.lastname@inter.ikea.com"
            hint="You can add multiple users. Use comma or semicolon as a separator or copy/paste from Excel cells."
            class="mb-4"
            :color="scripts[chosenScript].removalAction ? 'error' : 'success'"
            @paste="onPaste($event, users, 'users')"
            @keydown.enter.prevent="addUser"
            @keydown.tab="addUser"
            @blur="addUser"
          >
          <template #prepend-inner>
            <v-icon :color="scripts[chosenScript].removalAction ? 'error' : 'success'">fas fa-user</v-icon>
          </template>
          </v-text-field>

           <!--Mailbox/DL - Owner add text field-->
           <v-text-field
            v-if="scripts[chosenScript].requiresOwner"
            v-model="newUser"
            :disabled="scripts[chosenScript].isLoading"
            autogrow
            clearable
            label="Owner to add"
            placeholder="firstname.lastname@inter.ikea.com"
            hint="You can add multiple owners. Use comma or semicolon as a separator or copy/paste from Excel cells."
            class="mb-4"
            color="success"
            @paste="onPaste($event, users, 'users')"
            @keydown.enter.prevent="addUser"
            @keydown.tab="addUser"
            @blur="addUser"
          >
          <template #prepend-inner>
            <v-icon color="success">fas fa-user</v-icon>
          </template>
          </v-text-field>

          <!--Mailbox/DL - Owner remove text field-->
          <v-text-field
            v-if="scripts[chosenScript].requiresOwner && keepOwners"
            v-model="removedOwner"
            :disabled="scripts[chosenScript].isLoading"
            autogrow
            clearable
            label="Owner to remove"
            placeholder="firstname.lastname@inter.ikea.com"
            hint="You can remove multiple owners. Use comma or semicolon as a separator or copy/paste from Excel cells."
            class="mb-4"
            color="error"
            @paste="onPaste($event, ownersToRemove, 'owners')"
            @keydown.enter.prevent="removeOwner"
            @keydown.tab="removeOwner"
            @blur="removeOwner"
          >
          <template #prepend-inner>
            <v-icon color="error">fas fa-user</v-icon>
          </template>
          </v-text-field>

          <!--Invalid users and mailboxes alerts-->
          <v-alert
            v-if="
              (invalidUsers.length > 0 || invalidOwners.length > 0 || invalidMailboxes.length > 0) &&
              scripts[chosenScript].multipleUsers
            "
            class="my-4 animate__animated animate__flash"
            type="error"
            >At least one of the email addresses has an incorrect format.</v-alert
          >
          <!--External users alert-->
          <v-alert
            v-if="showExternalDomainUsersAlert"
            :class="{ 'animate__animated animate__flash': animate }"
            class="my-4"
            type="warning"
            >An external user was found. Please ensure an external contact exists before running the
            script.</v-alert
          >

          <!--Removed pasted text-->
          <v-expansion-panels v-if="removedPastedText.length > 0" class="my-2">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">fas fa-info</v-icon>
                Detected and Removed Invalid Content
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-card>
                  <span>
                    <v-tooltip text="Clear info">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          class="float-right"
                          icon="fas fa-circle-xmark"
                          variant="text"
                          @click="removedPastedText = []"
                        ></v-btn>
                      </template>
                    </v-tooltip>
                  </span>
                  <v-card-text>Invalid content detected in your paste action has been automatically removed from script inputs.</v-card-text>
                    <v-chip v-for="(text, index) in removedPastedText" :key="index" color="error" class="ma-1">{{text}}</v-chip>
                </v-card>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!--Shared mailboxes list-->
          <v-card
            v-if="
              scripts[chosenScript].multipleUsers &&
              !scripts[chosenScript].requiresDL &&
              mailboxes.length > 0
            "
            class="bg-secondary mb-4 pb-2"
          >
            <v-card-title>
              <v-badge color="primary" :content="mailboxes.length" class="mr-2">
                <v-icon class="mr-2">fas fa-envelope</v-icon>
              </v-badge>
              <span v-if="mailboxes.length > 1"
                >Shared mailboxes</span
              ><span v-else>Shared mailbox </span>
              <v-tooltip text="Clear all mailboxes">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="float-right"
                    icon="fas fa-circle-xmark"
                    variant="text"
                    @click="mailboxes = []"
                  ></v-btn>
                </template>
              </v-tooltip>
            </v-card-title>
            <div class="align-start flex-column d-flex">
              <v-chip
                v-for="(sharedmailbox, index) in mailboxes"
                :key="index"
                class="mb-1 ml-2 animate__backInDown animate__animated"
                :class="{ 'bg-error': invalidMailboxes.includes(sharedmailbox) }"
              >
                {{ sharedmailbox }}
                <v-icon class="ml-1" color="primary" size="small" @click="removeMailbox(index)"
                  >fas fa-circle-xmark</v-icon
                >
              </v-chip>
            </div>
          </v-card>

          <!--DL list-->
          <v-card
            v-if="
              scripts[chosenScript].multipleUsers &&
              scripts[chosenScript].requiresDL &&
              mailboxes.length > 0
            "
            class="bg-secondary mb-4 pb-2"
          >
            <v-card-title>
              <v-badge color="primary" :content="mailboxes.length" class="mr-2">
                <v-icon class="mr-2">fas fa-envelope</v-icon>
              </v-badge>
              <span v-if="mailboxes.length > 1"
                >Distribution Lists</span
              ><span v-else>Distribution List</span>
              <v-tooltip text="Clear all DLs">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="float-right"
                    icon="fas fa-circle-xmark"
                    variant="text"
                    @click="mailboxes = []"
                  ></v-btn>
                </template>
              </v-tooltip>
            </v-card-title>
            <div class="align-start flex-column d-flex">
              <v-chip
                v-for="(distributionlist, index) in mailboxes"
                :key="index"
                class="mb-1 ml-2 animate__backInDown animate__animated"
                :class="{ 'bg-error': invalidMailboxes.includes(distributionlist) }"
              >
                {{ distributionlist }}
                <v-icon class="ml-1" color="primary" size="small" @click="removeMailbox(index)"
                  >fas fa-circle-xmark</v-icon
                >
              </v-chip>
            </div>
          </v-card>

          <!--Users list-->
          <v-card
            v-if="scripts[chosenScript].multipleUsers && users.length > 0"
            class="bg-secondary pb-2 mb-4"
          >
            <v-card-title>
              <v-badge :color="scripts[chosenScript].removalAction ? 'error' : 'success'" :content="users.length" class="mr-2">
                <v-icon class="mr-2">fas fa-user</v-icon>
              </v-badge>
              <span v-if="scripts[chosenScript].requiresOwner">Owner to add</span>
              <span v-if="!scripts[chosenScript].requiresOwner && !scripts[chosenScript].removalAction"><span v-if="users.length === 1">User</span><span v-else>Users</span></span>
              <span v-if="!scripts[chosenScript].requiresOwner && scripts[chosenScript].removalAction"><span v-if="users.length === 1">User</span><span v-else>Users</span></span>
              <v-tooltip text="Clear all users">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="float-right"
                    icon="fas fa-circle-xmark"
                    variant="text"
                    @click="
                      clearAllUsers(users, 'users')
                    "
                  ></v-btn>
                </template>
              </v-tooltip>
            </v-card-title>
            <div class="align-start flex-column d-flex">
              <v-virtual-scroll
              :items="sortedUsers"
              max-height="275"
              item-height="50"
              class="show-scrollbar"
              width="100%"
            >
              <template #default="{ item, index }">
                <v-chip
                  :key="index"
                  class="mb-1 ml-2"
                  :class="{
                    'bg-error': invalidUsers.includes(item),
                    'bg-warning': externalDomainUsers.includes(item) && !invalidUsers.includes(item)
                  }"
                >
                  {{ item }}
                  <v-icon class="ml-1" color="primary" size="small" @click="removeUser(index, users, 'users')">
                    fas fa-circle-xmark
                  </v-icon>
                </v-chip>
              </template>
            </v-virtual-scroll>
            </div>
          </v-card>

          <!--Owner to remove list-->
          <v-card
            v-if="scripts[chosenScript].requiresOwner && ownersToRemove.length > 0 && keepOwners"
            class="bg-secondary pb-2"
          >
            <v-card-title>
              <v-badge color="error" :content="ownersToRemove.length" class="mr-2">
                <v-icon class="mr-2">fas fa-user</v-icon>
              </v-badge>
              <span>Owner to remove</span>
              <v-tooltip text="Clear all users">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="float-right"
                    icon="fas fa-circle-xmark"
                    variant="text"
                    @click="
                      clearAllUsers(ownersToRemove, 'owners')
                    "
                  ></v-btn>
                </template>
              </v-tooltip>
            </v-card-title>
            <div class="align-start flex-column d-flex">
              <v-chip
                v-for="(user, index) in ownersToRemove"
                :key="index"
                class="mb-1 ml-2 animate__backInDown animate__animated"
                :class="{
                  'bg-error': invalidOwners.includes(user),
                  'bg-warning': externalDomainOwners.includes(user) && !invalidOwners.includes(user)
                }"
              >
                {{ user }}
                <v-icon class="ml-1" color="primary" size="small" @click="removeUser(index, ownersToRemove, 'owners')"
                  >fas fa-circle-xmark</v-icon
                >
              </v-chip>
            </div>
          </v-card>
        </v-card>

        <!--Script is running-->
        <v-card v-else flat class="ma-2"
          ><v-card-title
            >Script is running
            <v-btn
              class="float-right"
              icon="fas fa-xmark"
              variant="plain"
              @click="closeScriptDrawer()"
            ></v-btn></v-card-title
        ></v-card>

        <!--Loading-->
        <div
          v-if="scripts[chosenScript].isLoading && !scripts[chosenScript].scriptCompleted"
          class="d-flex flex-column justify-center align-center mt-8"
        >
          <v-progress-circular
            :model-value="scripts[chosenScript].loadingValue"
            :rotate="360"
            color="primary"
            :size="100"
            :width="15"
            >{{ scripts[chosenScript].loadingTime }} ms</v-progress-circular
          >
          <v-alert v-if="scripts[chosenScript].longLoadingMessage" class="ma-4" type="info">{{
            scripts[chosenScript].longLoadingMessage
          }}</v-alert>
        </div>

        <!--isProcessing-->
        <div
          v-if="isProcessing"
          class="d-flex flex-column justify-center align-center mt-8"
        >
        <v-card-text>Processing large amount of pasted data</v-card-text>
          <v-progress-circular
            indeterminate
            color="primary"
            ></v-progress-circular
          >
          <v-alert v-if="scripts[chosenScript].longLoadingMessage" class="ma-4" type="info">{{
            scripts[chosenScript].longLoadingMessage
          }}</v-alert>
        </div>

        <ScriptResult v-if="showScriptStatus" :chosen-script="scripts[chosenScript]" />
        <ScriptResultMultipleLogs
          v-if="showScriptStatusMultipleLogs"
          :chosen-script="scripts[chosenScript]"
        />
      </div>
      <MemoryGame v-if="scripts[chosenScript].longLoadingMessage && scripts[chosenScript].longLoadingMessage != ''" />

      <!--Sticky banner with Run script and Automapping actions-->
      <div class="sticky-bottom-banner">
        <v-banner
          v-if="!scripts[chosenScript].isLoading"
          :sticky="true"
          stacked
          lines="one"
          density="comfortable"
          :elevation="0"
        >
          <!--Automapping and Keep DL owner switch-->
          <v-container style="max-width: 150px; max-height: 100px" class="pa-0 ma-0">
            <v-switch
              v-if="scripts[chosenScript].requiresAutomappingValue"
              v-model="automapping"
              :disabled="scripts[chosenScript].isLoading"
              color="primary"
              label="Automapping"
              class="ma-0 pa-0 mb-2"
              density="compact"
              hide-details
            />
            <v-switch
              v-if="scripts[chosenScript].requiresDLReplaceCheckbox"
              v-model="keepOwners"
              :disabled="scripts[chosenScript].isLoading"
              color="primary"
              label="Keep existing owners"
              class="ma-0 pa-0 mb-2"
              density="compact"
              hide-details
            />
          </v-container>
          <template #actions>
            <v-btn
              class="mb-2"
              :class="{ 'animate__animated animate__heartBeat': !isButtonDisabled }"
              :disabled="isButtonDisabled"
              @click="runScript(chosenScript)"
              >Run Script</v-btn
            >
          </template>
        </v-banner>
      </div>
    </v-navigation-drawer>

    <!--Script list-->
    <v-sheet
      v-if="!showHistory"
      class="bg-background w-100 mx-auto d-flex flex-column flex-grow-1 py-0 px-2"
      style="height: 90vh"
    >
      <v-text-field
        v-model="search"
        prepend-inner-icon="fas fa-magnifying-glass"
        placeholder="Search Scripts"
        class="flex-grow-0"
      ></v-text-field>
      <v-card-title v-if="showCardTitle">
        {{ cardTitle }} 
        <v-chip>{{ filteredScripts.length }} scripts</v-chip>
      </v-card-title>
      <div class="show-scrollbar container" style="height: 100%">
        <v-row>
          <v-col
            v-for="(script, index) in filteredScripts"
            :key="index"
            cols="6"
            class="d-flex flex-column"
          >
            <v-card
              v-if="script.id != 13"
              hover
              class="bg-secondary"
              min-height="120"
              @click="prepareScript(script)"
            >
              <v-card-title
                >{{ script.name }}
                <v-btn
                  class="float-right"
                  size="small"
                  :icon="isFavorite(script.id) ? 'fas fa-star' : 'far fa-star'"
                  variant="plain"
                  @click.stop="toggleFavorite(script.id)"
                ></v-btn
              ></v-card-title>
              <v-card-text>{{ script.description }}</v-card-text>
            </v-card>
            <v-card
              v-else
              class="bg-secondary"
              hover
              min-height="120"
              @click="
                openDialog()
              "
            >
              <v-card-title
                >{{ script.name }}
                <v-btn
                  class="float-right"
                  size="small"
                  :icon="isFavorite(script.id) ? 'fas fa-star' : 'far fa-star'"
                  variant="plain"
                  @click.stop="toggleFavorite(script.id)"
                ></v-btn
              ></v-card-title>
              <v-card-text>{{ script.description }}</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-sheet>

    <!-- Script history-->
    <ScriptHistory v-if="showHistory" />
  </div>
</template>

<script setup>
import MemoryGame from '@/components/PLIPAssist/MemoryGame.vue'
import ScriptHistory from '@/components/PLIPAssist/ScriptHistory.vue'
import ScriptResult from '@/components/PLIPAssist/ScriptResult.vue'
import ScriptResultMultipleLogs from '@/components/PLIPAssist/ScriptResultMultipleLogs.vue'
import { updateMonthlyUsageCount } from '../firebase.js'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useMyStore } from '@/stores/items.js'
import validator from 'validator'
const store = useMyStore()
const theme = useTheme()
const enableMaxMinWindowButtons = ref(false)
const drawer = ref(true)
const dialog = ref(false)
const dialogIsLoading = ref(false)
const dialogCloseText = ref('Do not show this again')
const dialogText = ref([
  'ExchangeOnlineManagement module in PowerShell is required to run the exchange scripts. Do you want my script to install it?'
])
const dialogValue = ref(10)
const bufferValue = ref(20)
const interval = ref(0)
const dialogInstallSuccess = ref(false)
const scriptDrawer = ref(false)
const showSnackbar = ref(false)
const snackbarScriptID = ref(0)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const showHistory = ref(false)
const isMaximized = ref(true)
const search = ref('')
const computerName = ref('')
const userName = ref({ networkID: '', email: '' })
const users = ref([])
const ownersToRemove = ref([])
const validEmails = ref(true)
const automapping = ref(false)
const keepOwners = ref(true)
const newUser = ref('')
const removedOwner = ref('')
const newMailbox = ref('')
const mailbox = ref('')
const displayName = ref('')
const mailboxes = ref([])
const isProcessing = ref(false);
let animate = ref(false);
const removedPastedText = ref([])
const externalDomainUsers = ref([])
const externalDomainOwners = ref([])
const textFieldRulesComputer = ref([
  (value) => {
    if (typeof value === 'undefined' || value === null) {
      return 'Value is required'
    }
    const trimmedValue = value.trim()
    const computerNamePattern = /^[a-zA-Z]{7,8}-[a-zA-Z]{2}\d{4}$/

    if (computerNamePattern.test(trimmedValue)) {
      return true
    } else {
      return 'Input must be a valid computer name'
    }
  }
])
const textFieldRulesNetworkID = ref([
  (value) => {
    if (typeof value === 'undefined' || value === null) {
      return 'Value is required'
    }
    const trimmedValue = value.trim()
    const networkIdPattern = /^[a-zA-Z0-9]{4,7}$/

    if (networkIdPattern.test(trimmedValue)) {
      return true
    } else {
      return 'Input must be a valid network ID'
    }
  }
])
const textFieldRulesMailbox = ref([
  (value) => {
    if (typeof value === 'undefined' || value === null) {
      return 'Value is required'
    }
    const trimmedValue = value.trim()

    if (validator.isEmail(trimmedValue) && trimmedValue.endsWith('@inter.ikea.com')) {
      return true
    } else {
      return 'Input must be a valid email address'
    }
  }
])
const textFieldRulesDisplayName = ref([
  (value) => {
      if (typeof value === 'undefined' || value === null || value === '') {
        return 'Display Name is required'
      } else {
        return true
      }
    }
])
const categories = ref([
  { title: 'Favorites', value: 'favorites', icon: 'fas fa-star', show: false },
  { title: 'Script History', value: 'history', icon: 'fas fa-clock-rotate-left', show: false },
  { title: 'Script library', value: 'library', icon: 'fas fa-code', show: true },
  { title: 'Account', value: 'account', icon: 'fas fa-users-gear', show: false },
  { title: 'Exchange', value: 'exchange', icon: 'fas fa-envelope', show: false },
  { title: 'ICC4', value: 'icc4', icon: 'fas fa-desktop', show: false },
  { title: 'IDEM', value: 'idem', icon: 'fas fa-desktop', show: false }
])
const chosenScript = ref(0)
const scripts = ref([
  {
    id: 0,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'IDEM Agent - Check Status',
    description: 'This script will check the current status of the IDEMAgent on a remote client.',
    icon: 'Test',
    color: 'Test',
    category: 'IDEM',
    tags: 'Test',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false,
    run: 'check-status'
  },
  {
    id: 1,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Run IDEM Agent',
    description: 'This will run IDEM agent on any client or server.',
    icon: 'Test',
    color: 'Test',
    category: 'IDEM',
    tags: 'Test',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false,
   // run: 'run-idem'
  },
  {
    id: 2,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Stop IDEM Agent',
    description: 'This script will stop the IDEM Agent on a remote client.',
    icon: 'Test',
    color: 'Test',
    category: 'IDEM',
    tags: 'Test',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 3,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Clear WSUS',
    description:
      'This script will clear the WSUS_InstallQueryDate registry value so the client checks for windows updates again',
    icon: 'Test',
    color: 'Test',
    category: 'ICC4',
    tags: 'Test',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 4,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Create share shortcuts',
    description: 'This script will fetch common and project share access and add all shortcuts',
    icon: 'Test',
    color: 'Test',
    category: 'ICC4',
    tags: 'Test',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 5,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Run Logon Scripts',
    description: 'This script will run the LogonScripts on a remote client.',
    icon: 'Test',
    color: 'Test',
    category: 'IDEM',
    tags: 'IDEM, LogonScripts, Logon, Login',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 6,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Clear Credential Manager',
    description: 'This script will clear the Credential Manager on the client',
    icon: 'Test',
    color: 'Test',
    category: 'ICC4',
    tags: 'Login, password',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 7,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Add RAS group access',
    description: 'This script will add RAS group access to the user',
    icon: 'Test',
    color: 'Test',
    category: 'Account',
    tags: 'VPN',
    requiresNetworkID: true,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false
  },
  {
    id: 8,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Run GPUpdate',
    description: 'This will run GPUpdate /force on a remote client.',
    icon: 'Test',
    color: 'Test',
    category: 'ICC4',
    tags: 'Policy, Policies',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: true,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false,
   // run: 'gp-update'
  },
  {
    id: 9,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Mailbox - Remove permissions',
    description:
      'Remove users Full and Send As permission from a shared mailbox. Multiple users and shared mailboxes are allowed.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, access',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: true,
    removalAction: true,
    requiresAutomappingValue: false,
    run: 'remove-user-mailbox-access'
  },
  {
    id: 10,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Mailbox - Get permissions',
    description: 'Collect information about the permissions on a shared mailbox.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, access',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: true,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false,
    run: 'get-mailbox-permissions'
  },
  {
    id: 11,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Mailbox - Change automapping',
    description:
      'Choose if automapping should be enabled or not for a single user on a shared mailbox.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, access, add, remove',
    requiresNetworkID: false,
    requiresUserEmail: true,
    requiresComputer: false,
    requiresMailbox: true,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: true
    //  run: changeAutomapping,
  },
  {
    id: 12,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Mailbox - Give permissions',
    description:
      'Give user(s) Full Access and Send As permission to a shared mailbox or several mailboxes. Can also be used to enable/disable automapping for existing users.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, access, add, mailbox, automap',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: true,
    requiresAutomappingValue: true,
    run: 'give-mailbox-access',
  },
  {
    id: 13,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Install ExchangeOnlineManagement module',
    description:
      'ExchangeOnlineManagement module in PowerShell is required to run the exchange scripts. This script make sure you have the module installed.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, access, add, mailbox, powershell',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresOwner: false,
    multipleUsers: false,
    requiresAutomappingValue: false,
    run: 'install-exchange-module'
  },
  {
    id: 14,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'DL - Add users',
    description: 'Add user(s) to Distribution group(s).',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, dl, list, access, add',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresDL: true,
    requiresOwner: false,
    multipleUsers: true,
    requiresAutomappingValue: false,
    run: 'give-dl-access'
  },
  {
    id: 15,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'DL - Remove users',
    description: 'Remove user(s) from Distribution group(s).',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, dl, list, access',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresDL: true,
    requiresOwner: false,
    removalAction: true,
    multipleUsers: true,
    requiresAutomappingValue: false,
    run: 'remove-dl-access'
  },
  {
    id: 16,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'Mailbox - Create new shared mailbox',
    description:
      'Create a new shared mailbox',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, groupmailbox, group, access, add, mailbox, automap',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresOwner: false,
    requiresMailbox: true,
    multipleUsers: true,
    requiresDisplayName: true,
    requiresAutomappingValue: true,
   // run: 'create-shared-mailbox',
  },
  {
    id: 17,
    scriptCompleted: false,
    scriptMessage: [],
    scriptError: [],
    isLoading: false,
    loadingValue: 0,
    loadingTime: 0,
    longLoadingMessage: '',
    interval: -1,
    name: 'DL - Manage owners',
    description:
      'Manage owner(s) to Distribution group(s). Choose to keep the old owner(s) while adding new owners or choose to replace the old owners. You can also specify which user to remove if you do not want to remove all existing owners.',
    icon: 'Test',
    color: 'Test',
    category: 'Exchange',
    tags: 'Exchange, Outlook, Office, access, remove, add',
    requiresNetworkID: false,
    requiresUserEmail: false,
    requiresComputer: false,
    requiresMailbox: false,
    requiresDL: true,
    requiresOwner: true,
    requiresDLReplaceCheckbox: true,
    multipleUsers: true,
    requiresDisplayName: false,
    requiresAutomappingValue: false,
    run: 'add-dl-owners',
  },
])

///////////////////////////////////////////////////
//COMPUTED
///////////////////////////////////////////////////

const isFavorite = computed(() => (scriptId) => {
  return store.favoriteScripts.includes(scriptId)
})
const cardTitle = computed(() => {
  if (search.value !== '') {
    return 'Search result'
  } else {
    const activeCategory = categories.value.find((category) => category.show)
    return activeCategory ? activeCategory.title : 'Script library'
  }
})
const showCardTitle = computed(
  () => search.value !== '' || categories.value.some((category) => category.show)
)
const filteredScripts = computed(() => {
  const matchesSearch = (script) =>
    script.name.toLowerCase().includes(search.value.toLowerCase()) ||
    script.description.toLowerCase().includes(search.value.toLowerCase()) ||
    script.tags.toLowerCase().includes(search.value.toLowerCase())

  const hasRunProperty = (script) => 'run' in script

  const activeCategory = categories.value.find((category) => category.show)

  if (activeCategory && activeCategory.value === 'favorites' && search.value === '') {
    return store.favoriteScripts
      .map((id) => {
        return scripts.value.find((script) => script.id === id)
      })
      .filter((script) => {
        return script && matchesSearch(script) && hasRunProperty(script)
      })
  } else if (activeCategory && activeCategory.value !== 'library' && search.value === '') {
    return scripts.value.filter((script) => {
      return (
        matchesSearch(script) && script.category === activeCategory.title && hasRunProperty(script)
      )
    })
  } else if (search.value === '') {
    return scripts.value.filter(hasRunProperty)
  } else {
    return scripts.value.filter((script) => matchesSearch(script) && hasRunProperty(script))
  }
})
const areRulesMet = computed(() => {
  let rulesMet = true

  if (scripts.value[chosenScript.value].requiresMailbox) {
    rulesMet = rulesMet && textFieldRulesMailbox.value.every((rule) => rule(mailbox.value) === true)
  }

  if (scripts.value[chosenScript.value].requiresDisplayName) {
    rulesMet = rulesMet && displayName.value !== ''
  }

  if (scripts.value[chosenScript.value].requiresNetworkID) {
    rulesMet =
      rulesMet &&
      textFieldRulesNetworkID.value.every((rule) => rule(userName.value.networkID) === true)
  }

  if (scripts.value[chosenScript.value].requiresUserEmail) {
    rulesMet =
      rulesMet && textFieldRulesMailbox.value.every((rule) => rule(userName.value.email) === true)
  }

  if (scripts.value[chosenScript.value].requiresComputer) {
    rulesMet =
      rulesMet && textFieldRulesComputer.value.every((rule) => rule(computerName.value) === true)
  }

  return rulesMet
})
const isButtonDisabled = computed(() => {
  const script = scripts.value[chosenScript.value];
  return (
    (script.multipleUsers &&
      (invalidUsers.value.length > 0 ||
        invalidOwners.value.length > 0 ||
        invalidMailboxes.value.length > 0 ||
        (script.requiresOwner
          ? users.value.length === 0 && ownersToRemove.value.length === 0
          : users.value.length === 0 && !script.requiresDisplayName) ||
        (mailboxes.value.length === 0 && !script.requiresDisplayName))) ||
    !areRulesMet.value ||
    script.isLoading ||
    !script.run
  );
});
const invalidUsers = computed(() => {
  if (scripts.value[chosenScript.value].requiresDL && !scripts.value[chosenScript.value].requiresOwner) {
    return users.value.filter(
      (user) => !validator.isEmail(user)
    )
  } else {
    return users.value.filter(
      (user) => !validator.isEmail(user) || !/.+\..+@/.test(user) || !user.endsWith('@inter.ikea.com')
    )
  }
})
const invalidOwners = computed(() => {
    const regex = /^[^@]*\.[^@]*@inter\.ikea\.com$/;
  return ownersToRemove.value.filter(
    (user) => !regex.test(user)
  )
})
const invalidMailboxes = computed(() => {
  return mailboxes.value.filter(
    (mailbox) => !validator.isEmail(mailbox) || (!mailbox.endsWith('@inter.ikea.com') && !mailbox.endsWith('@OneIIG.onmicrosoft.com'))
  )
})
const showScriptStatus = computed(() => {
  const script = scripts.value[chosenScript.value]
  return (
    script.scriptCompleted &&
    script.scriptError &&
    script.scriptError.length < 3 &&
    script.scriptMessage &&
    script.scriptMessage.length < 3
  )
})
const showScriptStatusMultipleLogs = computed(() => {
  const script = scripts.value[chosenScript.value]
  return (
    script.scriptCompleted &&
    ((script.scriptError && script.scriptError.length > 2) ||
      (script.scriptMessage && script.scriptMessage.length > 2))
  )
})
const showExternalDomainUsersAlert = computed(() => {
  return (
    (externalDomainUsers.value.length > 0 || externalDomainOwners.value.length > 0) &&
    scripts.value[chosenScript.value].requiresDL &&
    scripts.value[chosenScript.value].multipleUsers
  );
});
const sortedUsers = computed(() => {
  return users.value.slice().sort((a, b) => {
    const aInvalid = invalidUsers.value.includes(a);
    const bInvalid = invalidUsers.value.includes(b);
    if (aInvalid && !bInvalid) return -1;
    if (!aInvalid && bInvalid) return 1;
    return 0;
  });
});
//Uncomment below to set automapping to false if more than 3 mailboxes.
//const mailboxesLength = computed(() => mailboxes.value.length)
///////////////////////////////////////////////////
//WATCH
///////////////////////////////////////////////////
watch(
  () => store.favoriteScripts,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      categories.value.find((category) => category.value === 'favorites').show = true
    } else {
      categories.value.find((category) => category.value === 'library').show = true
    }
  },
  { immediate: true }
)
watch(dialogValue, (val) => {
  if (val < 100) return

  dialogValue.value = 0
  bufferValue.value = 10
  startBuffer()
})
//Uncomment below to set automapping to false if more than 3 mailboxes.
/*watch(mailboxesLength, (newValue) => {
  automapping.value = newValue > 3 ? false : true
})*/
watch(showExternalDomainUsersAlert, (newValue) => {
  if (newValue) {
    animate.value = true;

    setTimeout(() => {
      animate.value = false;
    }, 3000); // Adjust the timeout to match the duration of your animation
  }
});

///////////////////////////////////////////////////
//METHODS
///////////////////////////////////////////////////
const colorChangedHandler = (data) => {
    const { storeThemeName, color, key } = data
    store.changeColor({
      theme: storeThemeName,
      color: color,
      key: key
    })
    setCustomColors('customDarkTheme', 'myCustomDarkTheme')
    setCustomColors('customLightTheme', 'myCustomLightTheme')
}
const themeToggleHandler = (data) => {
    theme.global.name.value =
    theme.global.name.value === 'myCustomLightTheme' ? 'myCustomDarkTheme' : 'myCustomLightTheme'
    const themeName = data
    theme.global.name.value = themeName
    store.setTheme(themeName)
}
const colorResetHandler = (data) => {
    const themeName =
      data.storeThemeName === 'customDarkTheme' ? 'myCustomDarkTheme' : 'myCustomLightTheme'
    if (themeName === 'myCustomDarkTheme') {
      theme.themes.value[themeName].colors.primary = '#80d0ff'
      theme.themes.value[themeName].colors.secondary = '#374955'
      theme.themes.value[themeName].colors.tertiary = '#f3dbc5'
    } else {
      theme.themes.value[themeName].colors.primary = '#1E4A7D'
      theme.themes.value[themeName].colors.secondary = '#F1EDF1'
      theme.themes.value[themeName].colors.tertiary = '#7d5260'
    }
    store.resetColors(data.storeThemeName)
}
const setCustomColors = (customTheme, myCustomTheme) => {
  const themes = theme.themes.value

  if (!store[customTheme]) {
    console.error(`Could not find custom theme: ${customTheme}`)
    return
  }

  if (!themes[myCustomTheme] || !themes[myCustomTheme].colors) {
    console.error(`Could not find myCustomTheme: ${myCustomTheme}`)
    return
  }

  Object.entries(store[customTheme]).forEach(([key, value]) => {
    if (value) {
      themes[myCustomTheme].colors[key] = value
    }
  })
}
const sendIpcMessage = (message) => {
  window.api.sendMessage(message)
}
const handleResize = async () => {
  isMaximized.value = await window.api.isWindowMaximized();
}
const toggleFavorite = (scriptId) => {
  store.TOGGLE_FAVORITE(scriptId)
}
const maximizeWindow = () => {
  window.api.sendMessage('maximize-winPLIPAssist')
  isMaximized.value = true
  drawer.value = true
}
const restoreWindow = () => {
  window.api.sendMessage('restore-winPLIPAssist')
  isMaximized.value = false
}
const isValidEmail = (email) => {
  return validator.isEmail(email)
}
const checkExternalDomain = (usersArray, arrayType) => {
  if(scripts.value[chosenScript.value].requiresOwner) {
    return
  }
  const validUsers = usersArray.filter((user) => validator.isEmail(user))

  // Check if any valid user has a domain other than "@inter.ikea.com"
  if(arrayType === 'users') {
    externalDomainUsers.value = validUsers.filter((user) => {
      const domain = user.split('@')[1]
      return domain !== 'inter.ikea.com'
    })
  }

  if(arrayType === 'owners') {
    externalDomainOwners.value = validUsers.filter((user) => {
      const domain = user.split('@')[1]
      return domain !== 'inter.ikea.com'
    })
  }
}
const onPaste = (event, array, arrayType) => {
  const pastedData = event.clipboardData.getData('text');
  removedPastedText.value = [];
  isProcessing.value = true;

  const worker = new Worker(new URL('./pasteWorker.js', import.meta.url));

  worker.onmessage = function (e) {
    const { pastedItems, removedItems } = e.data;
    removedPastedText.value = removedItems;

    // If there's only one item being pasted
    if (pastedItems.length === 1) {
      const singleItem = pastedItems[0];
      // Check if the single item is a valid email address
      if (isValidEmail(singleItem)) {
        // Add the single item to the array
        if (!array.includes(singleItem)) {
          array.push(singleItem);
        } else {
          store.showGeneralSnackbar = true;
          store.snackbarMessage = singleItem + ' is already in the list.';
        }
        // Clear the appropriate input field
        clearInputField(arrayType);
      }
    } else {
      // Add all items to the array
      pastedItems.forEach((item) => {
        if (!array.includes(item)) {
          array.push(item);
        } else {
          store.showGeneralSnackbar = true;
          store.snackbarMessage = 'Duplicate found. The address was not added twice';
        }
      });
      // Clear the appropriate input field
      clearInputField(arrayType);
    }

    checkExternalDomain(array, arrayType);
    isProcessing.value = false;
  };

  worker.postMessage({ pastedData });
};
const clearInputField = (arrayType) => {
  if (arrayType === 'users') {
    setTimeout(() => {
      newUser.value = '';
    }, 300);
  } else if (arrayType === 'mailboxes') {
    setTimeout(() => {
      newMailbox.value = '';
    }, 300);
  } else if (arrayType === 'owners') {
    setTimeout(() => {
      removedOwner.value = '';
    }, 300);
  }
};
const addMailbox = () => {
  if (newMailbox.value.trim() !== '') {
    // Check if the new mailbox already exists in the array
    if (!mailboxes.value.includes(newMailbox.value.trim())) {
      mailboxes.value.push(newMailbox.value.trim())
    } else {
      store.showGeneralSnackbar = true
      store.snackbarMessage = newMailbox.value + ' is already in the list'
    }
    newMailbox.value = '' // Reset the input field
  }
}
const removeMailbox = (index) => {
  mailboxes.value.splice(index, 1)
}
const addUser = () => {
  if (newUser.value.trim() !== '') {
    users.value.push(newUser.value.trim())
    newUser.value = ''
    checkExternalDomain(users.value, 'users')
  }
}
const removeOwner = () => {
  if (removedOwner.value.trim() !== '') {
    ownersToRemove.value.push(removedOwner.value.trim())
    removedOwner.value = ''
   // checkExternalDomain(ownersToRemove.value, 'owners')
  }
}
const removeUser = (index, array, arrayType) => {
  array.splice(index, 1)
  checkExternalDomain(array, arrayType)
}
const clearInputsAndOutputs = () => {
  mailbox.value = ''
  displayName.value = ''
  mailboxes.value = []
  userName.value.networkID = ''
  userName.value.email = ''
  users.value = []
  ownersToRemove.value = []
  externalDomainUsers.value = []
  removedPastedText.value = []
  validEmails.value = true
  automapping.value = false
  scripts.value[chosenScript.value].scriptMessage = []
  scripts.value[chosenScript.value].scriptError = []
  scripts.value[chosenScript.value].scriptCompleted = false
}
const clearAllUsers = (array, arrayType) => {
  array.splice(0, array.length)
  checkExternalDomain(array, arrayType)
}
const closeScriptDrawer = () => {
  scriptDrawer.value = false
  clearInputsAndOutputs()
  checkExternalDomain(users.value, 'users')
  //checkExternalDomain(ownersToRemove.value, 'owners')
}
const show = (param) => {
  if (param === 'history') {
    showHistory.value = true
    showSnackbar.value = false
  } else {
    categories.value.forEach((category) => {
      category.show = category.value === param
    })
    showHistory.value = false
  }
}
const prepareScript = (script) => {
  chosenScript.value = script.id
  scriptDrawer.value = true
  clearInputsAndOutputs()
}
const startLoading = (id) => {
  scripts.value[id].interval = setInterval(() => {
    if (scripts.value[id].loadingValue >= 100) {
      scripts.value[id].loadingValue = 0 // Reset loadingValue to 0 when it reaches 100
    } else {
      scripts.value[id].loadingValue += 10
    }
    scripts.value[id].loadingTime += 10
    if (scripts.value[id].loadingTime > 50 && !scripts.value[id].longLoadingMessage) {
      scripts.value[id].longLoadingMessage =
        'This script usually takes a long time to load. The script will continue to run in the background. You can close this window (not the complete ITSD Tools app) and the script will continue to run. You will be notified when the script is completed.'
    }
  }, 1000)
}
const resetScriptState = (id) => {
  scripts.value[id].scriptCompleted = false
  scripts.value[id].scriptMessage = []
  scripts.value[id].scriptError = []
}
const scriptCompletedState = (id) => {
  scripts.value[id].isLoading = false
  window.api.sendMessage('isLoading', false)
  clearInterval(scripts.value[id].interval)
  scripts.value[id].loadingValue = 0
  scripts.value[id].loadingTime = 0
  scripts.value[id].longLoadingMessage = ''
  scripts.value[id].scriptCompleted = true
  const date = new Date()
  scripts.value[id].lastRun =
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
const showSnackbarMessage = (id, message, color) => {
  snackbarScriptID.value = id
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}
const openDialog = () => {
  dialogInstallSuccess.value = false
  dialog.value = true
  dialogText.value = ['ExchangeOnlineManagement module in PowerShell is required to run the exchange scripts. Do you want my script to install it?']
  dialogCloseText.value = 'Close'
}
const closeDialog = () => {
  dialog.value = false
  window.api.sendMessage('configDone', true)
  store.SET_CONFIG_DONE(true)
}
const startBuffer = () => {
  clearInterval(interval.value)

  interval.value = setInterval(() => {
    dialogValue.value += Math.random() * (15 - 5) + 5
    bufferValue.value += Math.random() * (15 - 5) + 6
  }, 2000)
}
const runScript = async (id) => {
  await updateMonthlyUsageCount(id, 'scripts');
  resetScriptState(id)
  scripts.value[id].isLoading = true
  window.api.sendMessage('isLoading', true)
  startLoading(id)
  if(id === 13) {
    dialogIsLoading.value = true;
    startBuffer();
  }
  const date = new Date()
  const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  const scriptArgs = {
    category: scripts.value[id].category,
    scriptName: scripts.value[id].name,
    computerName: computerName.value,
    networkID: userName.value.networkID,
    email: userName.value.email,
    users: users.value,
    mailbox: mailbox.value,
    mailboxDisplayName: displayName.value,
    mailboxes: mailboxes.value,
    automapping: automapping.value,
    keepOwners: keepOwners.value,
    ownersToRemove: ownersToRemove.value,
  }
  const serializedArgs = JSON.stringify(scriptArgs);
  const scriptToRun = scripts.value[id].run;  

  try {
    let { successMessages, errorMessages } = await window.api.invokeScript(scriptToRun, serializedArgs);
    const endDate = new Date();
    const executionTime = endDate - date;

    // Update the last run scripts in Vuex Store
    store.updateLastRunScripts({
      scriptName: scripts.value[id].name,
      category: scripts.value[id].category,
      successMessages: successMessages || [],
      errorMessages: errorMessages || [],
      timestamp,
      executionTime,
      computerName: computerName.value,
      networkID: userName.value.networkID,
      email: userName.value.email,
      users: users.value,
      ownersToRemove: ownersToRemove.value,
      mailbox: mailbox.value,
      mailboxes: mailboxes.value,
      automapping: automapping.value,
      keepOwners: keepOwners.value,
      requiresAutomappingValue: scripts.value[id].requiresAutomappingValue,
      requiresDLReplaceCheckbox: scripts.value[id].requiresDLReplaceCheckbox
    });

    // Display messages to the user live
    if (successMessages) {
      successMessages = Array.isArray(successMessages) ? successMessages : [successMessages];
      if (successMessages.some(message => message.trim().length > 0)) {
        scripts.value[id].scriptMessage = successMessages.filter(message => message.trim() !== '');
      }
      if(id === 13) {
            dialogText.value = successMessages;
            dialogInstallSuccess.value = true;
            dialogCloseText.value = 'Close';
            dialogIsLoading.value = false;
            clearInterval(interval.value);
      }
    }
    if (errorMessages) {
      errorMessages = Array.isArray(errorMessages) ? errorMessages : [errorMessages];
      if (errorMessages.some(message => message.trim().length > 0)) {
        scripts.value[id].scriptError = errorMessages.filter(message => message.trim() !== '');
      }
      if(id === 13) {
            dialogText.value = errorMessages;
            dialogInstallSuccess.value = true;
            dialogCloseText.value = 'Close';
            dialogIsLoading.value = false;
            clearInterval(interval.value);
      }
    }
    scriptCompletedState(id);
    if ((chosenScript.value != id || scriptDrawer.value == false) && id !== 13) {
      showSnackbarMessage(id, '"' + scripts.value[id].name + '" Script completed successfully', 'success');
    }

  } catch (error) {
    const endDate = new Date();
    const executionTime = endDate - date;

    // Add the error messages to the last run scripts in Vuex Store
    store.updateLastRunScripts({
      scriptName: scripts.value[id].name,
      category: scripts.value[id].category,
      successMessages: [],
      errorMessages: error.errorMessages || [error.message], // Assuming error has a message property
      timestamp,
      executionTime,
      computerName: computerName.value,
      networkID: userName.value.networkID,
      email: userName.value.email,
      users: users.value,
      mailbox: mailbox.value,
      mailboxes: mailboxes.value,
      automapping: automapping.value
    });

    // Display messages to the user live
    const errorMessages = error.errorMessages || [error.message]; // Assuming error has a message property
    if (errorMessages.some(message => message.trim().length > 0)) {
      scripts.value[id].scriptError = errorMessages.filter(message => message.trim() !== '');
    }
    scriptCompletedState(id);
    if (chosenScript.value != id || scriptDrawer.value == false) {
      showSnackbarMessage(id, '"' + scripts.value[id].name + '" Script completed with errors', 'error');
    }
  }


}


///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(() => {
  store.setTheme(theme.global.name.value)
  handleResize();
  window.addEventListener('resize', handleResize);
  window.api.addEventListener('color-changed', colorChangedHandler)
  window.api.addEventListener('color-reset', colorResetHandler)
  window.api.addEventListener('toggle-theme', themeToggleHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.api.removeEventListener('color-changed', colorChangedHandler)
  window.api.removeEventListener('color-reset', colorResetHandler)
  window.api.removeEventListener('toggle-theme', themeToggleHandler)
});
</script>

<style scoped>
.container {
  overflow-y: auto;
  overflow-x: hidden;
}

.sticky-bottom-banner {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0px; /* Adjust padding as needed */
}

.app-bar::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url('@/assets/bg.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.3; /* Adjust this value to change the opacity */
  z-index: -1;
}


</style>
