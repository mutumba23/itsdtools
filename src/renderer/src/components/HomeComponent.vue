<template>
  <!--Loading dialog--><v-dialog v-model="loading" fullscreen>
    <v-card class="d-flex justify-center align-center">
      <v-progress-circular indeterminate :size="128" color="primary"
        >Loading</v-progress-circular
      >
    </v-card>
  </v-dialog>

  <!--RANO dialog--><v-dialog v-model="showRANO">
    <v-card class="animate__animated animate__flipInX pb-2">
      <span>
        <v-text-field
          v-model="computername"
          label="Computer Name"
          placeholder="Format: itseelm-nb0001 or 10.xx-xx-xx"
          :rules="rules"
        ></v-text-field>
      </span>
      <v-btn v-if="isValidComputerName" class="ma-2 pa-2" color="tertiary" @click="runRANO"
        >Connect to {{ computername }}</v-btn
      >
      <v-card-actions><v-btn color="error" @click="showRANO = false">Close</v-btn></v-card-actions>
    </v-card>
  </v-dialog>

  <!--Snackbar--><v-snackbar
    v-model="showSnackbar"
    :timeout="3000"
    color="secondary"
    location="top"
    rounded="pill"
  >
    {{ snackbarText }}
  </v-snackbar>

  <!--Boxes-->
  <div
    id="dropContainer"
    class="d-flex justify-center flex-wrap"
    dropzone="dropContainer"
    @dragover.prevent
    @dragend="dragEnd"
    @dragenter="dragEnter"
    @drop="drop"
  >
    <!--Communication--><v-card
      v-if="sortedCommunications.length > 0 || store.settingsOverlay"
      id="communication"
      flat
      min-width="280"
      class="bg-secondary pb-4 ma-1"
      dropzone="communication"
      @dragover.prevent
      @dragend="dragEnd"
      @dragenter="dragEnter"
      @drop="drop"
    >
      <v-card-actions class="py-0 my-0 pl-0">
        <v-card-title v-if="!showBrowserSettings"
          ><span v-if="store.phoneMode && !store.settingsOverlay">Phone Mode</span><span v-if="!store.phoneMode && !store.settingsOverlay">Chat Mode</span><span v-if="store.settingsOverlay">Communication</span></v-card-title
        >
        <v-card-title v-else>Choose browser</v-card-title>
        <v-icon
          v-if="!showBrowserSettings && !store.settingsOverlay"
          class="mx-2"
          color="on-secondary"
          size="x-small"
          :style="{ opacity: store.phoneMode ? 1 : 0.3 }"
          @click="toggleMode(true)"
          >fas fa-phone</v-icon
        >
        <v-icon
          v-if="!showBrowserSettings && !store.settingsOverlay"
          class="mx-2"
          color="on-secondary"
          size="x-small"
          :style="{ opacity: store.phoneMode ? 0.3 : 1 }"
          @click="toggleMode(false)"
        >
          fas fa-message</v-icon
        >
        <v-spacer></v-spacer>
        <span>
          <v-icon
            color="on-secondary"
            size="small"
            class="settings"
            @click="showBrowserSettings = !showBrowserSettings"
            >fas fa-gear</v-icon
          ></span
        >
      </v-card-actions>

      <template v-for="communication in sortedCommunications" :key="communication.label">
        <v-row
          v-if="
            (store.phoneMode && communication.showOnPhoneMode) ||
            (!store.phoneMode && communication.showOnChatMode) ||
            showBrowserSettings ||store.settingsOverlay
          "
          class="flex-nowrap animate__animated animate__backInUp"
        >
          <v-btn
            class="ml-4 flex-grow-1 justify-start"
            style="text-transform: none"
            size="large"
            :prepend-icon="communication.icon"
            variant="text"
            draggable="true"
            @click="communicationButton(communication)"
            @dragstart="dragStart($event, communication)"
          >
            {{ communication.label }}
          </v-btn>
          <span v-if="showBrowserSettings" class="d-flex mr-4">
            <v-icon
              color="primary"
              :icon="communication.browserIcon"
              class="align-self-center"
              @click="changeBrowser(communication.id)"
            >
            </v-icon>
          </span>
        </v-row>
      </template>
    </v-card>

    <!--Custom links-->
    <v-card
      v-if="(customLinks.length > 0 && store.showCard.customLinks) || store.settingsOverlay"
      id="customLinks"
      flat
      class="bg-secondary pb-4 ma-1 flex-grow-1 custom-links-card show-scrollbar"
    >
      <v-card-title>Your Custom Links</v-card-title>
      <v-row v-for="(button, index) in customLinks" :key="index" class="flex-nowrap">
        <v-btn
          class="mx-4 flex-grow-1 justify-start animate__animated animate__backInUp"
          :style="{ textTransform: 'none' }"
          size="large"
          :prepend-icon="button.incognito ? 'fas fa-mask' : button.browser"
          variant="text"
          @click="
            openExternalLink(button.link, button.browser, {
              incognito: button.incognito
            })
          "
        >
          {{ button.name }}
        </v-btn>
      </v-row>
      <v-btn
        v-if="customLinks.length < 1"
        class="mx-4 flex-grow-1 justify-center"
        @click="showAddCustomLink"
        >Add custom link</v-btn
      >
    </v-card>

    <!--Remote assistance--><v-card
      v-if="sortedRemoteAssistance.length > 0 || store.settingsOverlay"
      id="remoteassistancecard"
      class="bg-secondary pb-4 ma-1 flex-grow-1 order-last"
      flat
      dropzone="remoteassistance"
      @dragover.prevent
      @dragend="dragEnd"
      @dragenter="dragEnter"
      @drop="drop"
    >
      <v-card-title>Remote Assistance</v-card-title>

      <v-row v-for="button in sortedRemoteAssistance" :key="button.label" class="flex-nowrap">
        <v-btn
          class="mx-4 flex-grow-1 justify-start animate__animated animate__backInUp"
          style="text-transform: none"
          size="large"
          :prepend-icon="button.icon"
          variant="text"
          draggable="true"
          @dragstart="dragStart($event, button)"
          @click="remoteAssistanceButton(button)"
        >
          {{ button.label }}
        </v-btn>
      </v-row>
    </v-card>

    <!--Tools--><v-card
      v-if="sortedCommonTools.length > 0 || store.settingsOverlay"
      id="commontools"
      class="bg-secondary pb-4 ma-1 flex-grow-1 custom-links-card show-scrollbar"
      flat
      dropzone="commontools"
      @dragover.prevent
      @dragend="dragEnd"
      @dragenter="dragEnter"
      @drop="drop"
    >
      <v-card-title>Common tools</v-card-title>

      <v-row v-for="item in sortedCommonTools" :key="item.label" class="flex-nowrap">
        <v-btn
          class="mx-4 flex-grow-1 justify-start animate__animated animate__backInUp"
          style="text-transform: none"
          size="large"
          :prepend-icon="item.icon"
          variant="text"
          draggable="true"
          @dragstart="dragStart($event, item)"
          @click="commonToolsButton(item)"
          >{{ item.label }}
        </v-btn>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { useMyStore } from '@/stores/items.js'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { updateMonthlyUsageCount } from '../firebase.js'
const store = useMyStore()

///////////////////////////////////////////////////
// Data values
///////////////////////////////////////////////////
const showBrowserSettings = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const showRANO = ref(false)
const computername = ref('')
const loading = ref(false)
// Data Values END
///////////////////////////////////////////////////

///////////////////////////////////////////////////
// Computed values
///////////////////////////////////////////////////
const sortedCommunications = computed(() => {
  return store.communications
    .filter((communication) => !communication.removed)
    .sort((a, b) => a.order - b.order)
})
const customLinks = computed(() => {
  return store.customLinks
})
const sortedRemoteAssistance = computed(() => {
  return store.remoteAssistance.filter((remoteAssistance) => !remoteAssistance.removed)
})
const sortedCommonTools = computed(() => {
  return store.commonTools.filter((commonTools) => !commonTools.removed)
})
const rules = computed(() => [
  (v) => {
    if (!v) return 'Field is required'
    // IP Address regex
    const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    // Computer name regex
    const computerNameRegex = /^[a-z]{6,8}-[a-z]{2}\d{4}$/i
    if (ipAddressRegex.test(v) || computerNameRegex.test(v)) {
      return true
    } else {
      return 'Please enter a valid IP address or a computer name in the specified format'
    }
  }
])
const isValidComputerName = computed(() => {
  const v = computername.value
  if (!v) return false
  const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  const computerNameRegex = /^[a-z]{6,8}-[a-z]{2}\d{4}$/i
  return (
    v.trim().length >= 11 &&
    v.trim().length <= 15 &&
    (ipAddressRegex.test(v.trim()) || computerNameRegex.test(v.trim()))
  )
})

//Computed values END
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//Methods
///////////////////////////////////////////////////
const dragStart = (event, item) => {
  event.dataTransfer.setData("application/json", JSON.stringify(item));
  event.target.classList.add('dragging');
};
const dragEnter = () => {
  const dropContainer = document.getElementById('dropContainer')
  if (store.settingsOverlay) {
    dropContainer.classList.add('dragging')
  }
}
const dragEnd = (event) => {
  event.target.classList.remove('dragging')
  const dropContainer = document.getElementById('dropContainer')
  dropContainer.classList.remove('dragging')
  window.api.sendMessage('drag-end')
}
const drop = (event) => {
  event.preventDefault()
  const data = event.dataTransfer.getData('application/json')
  const draggedObject = JSON.parse(data)

  switch (draggedObject.category) {
    case 'communications':
      store.toggleItemRemovedState({
        category: 'communications',
        id: draggedObject.id,
        value: false
      })
      window.api.sendMessage('added-item', draggedObject)
      break
    case 'remoteAssistance':
      store.toggleItemRemovedState({
        category: 'remoteAssistance',
        id: draggedObject.id,
        value: false
      })
      window.api.sendMessage('added-item', draggedObject)
      break
    case 'commonTools':
      store.toggleItemRemovedState({
        category: 'commonTools',
        id: draggedObject.id,
        value: false
      })
      window.api.sendMessage('added-item', draggedObject)
      break
    default:
      showSnackbar.value = true
      snackbarText.value = 'Something went wrong'
      break
  }
}
const toggleMode = (mode) => {
  store.togglePhoneMode(mode)
}
const communicationButton = async (item) => {
  const screenInfo = await window.api.getScreenInfo()
  const { screenWidth, screenHeight } = screenInfo

  const windowWidth = 800
  const x = screenWidth - windowWidth
  const y = 0

  if (item.label == 'Dashboard') {
    window.api.sendMessage('open-new-window', {
      url: 'https://now.ingka.com/$pa_dashboard.do?sysparm_dashboard=fa4dcfe687a699107d29fd98cebb3591&sysparm_tab=c87d0b2a87a699107d29fd98cebb35b0&sysparm_cancelable=true&sysparm_editable=undefined&sysparm_active_panel=false',
      width: windowWidth,
      height: screenHeight,
      x: x,
      y: y
    })
  } else {
    window.api.sendMessage('open-external-link', item.link, item.browserIcon, { incognito: false });
  }
  await updateMonthlyUsageCount(item.id, 'communications')
}
const openExternalLink = (link, browser, incognito) => {
  console.log(incognito)
  window.api.sendMessage('open-external-link', link, browser, incognito);
}
const changeBrowser = (id) => {
  const index = store.communications.findIndex((c) => c.id === id)
  if (index < 0) {
    console.error(`Communication with id ${id} not found`)
    return
  }
  const communication = store.communications[index]
  if (communication.browserIcon === 'fab fa-edge') {
    store.updateBrowserIcon({
      index,
      browserIcon: 'fab fa-chrome'
    })
  } else if (communication.browserIcon === 'fab fa-chrome') {
    store.updateBrowserIcon({
      index,
      browserIcon: 'fab fa-edge'
    })
  }
}
const showAddCustomLink = () => {
  window.api.sendMessage('show-add-custom-link')
}
const remoteAssistanceButton = async (button) => {
  switch (button.onClick) {
    case 'openRemoteAssistance':
      window.api.sendMessage('open-remote-assistance')
      break
    case 'openShadowRemote':
      showRANO.value = true
      break
    case 'openQuickAssist':
      window.api.sendMessage('open-quick-assist')
      break
    default:
      break
  }
  await updateMonthlyUsageCount(button.id, 'remoteAssistance')
}
const runRANO = () => {
  window.api.sendMessage('run-rano', computername.value)
  showRANO.value = false
}
const commonToolsButton = async (item) => {
  switch (item.label) {
        case "Screenshot":
          window.api.sendMessage('open-snipping-tool');
          break;
        case "iAssist":
          openExternalLink("https://iassist.ingka.com/login/signin", "fab fa-edge", { incognito: false });
          break;
        case "IMU":
          loading.value = true;
          window.api.sendMessage('open-imu');
          setTimeout(() => {
            loading.value = false; // Set loading to false after 5 seconds
          }, 2000);
          break;
        case "ADUC":
          loading.value = true;
          window.api.sendMessage('open-aduc');
          setTimeout(() => {
            loading.value = false; // Set loading to false after 5 seconds
          }, 5000);
          break;
        case "MyIdentity":
          openExternalLink("https://myidentity.apps.ikea.com", "fab fa-edge", { incognito: false });
          break;
        case "eGuides":
          openExternalLink("https://eguides.ikea.com/Home?", "fab fa-edge", { incognito: false });
          break;
        case "Jobba":
          openExternalLink("https://jobba.ingka.dev/", "fab fa-edge", { incognito: false });
          break;
        case "PLIPAssist":
          window.api.sendMessage('open-PLIPAssist');
          break;
        default:
          break;
      }
      await updateMonthlyUsageCount(item.id, 'commonTools');
}
const dragEndHandler = () => {
    const dropContainer = document.getElementById("dropContainer");
    dropContainer.classList.remove("dragging");
}
const removedItemHandler = (data) => {
    // Handle removed items based on their category
    switch (data.category) {
      case "communications":
        store.toggleItemRemovedState({
          category: "communications",
          id: data.id,
          value: true,
        });
        break;
      case "remoteAssistance":
        store.toggleItemRemovedState({
          category: "remoteAssistance",
          id: data.id,
          value: true,
        });
        break;
      case "commonTools":
        store.toggleItemRemovedState({
          category: "commonTools",
          id: data.id,
          value: true,
        });
        break;
      default:
        console.log("Category not matched:", data.category);
        break;
    }
  }

//Methods END
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(() => {
  store.UPDATE_COMMON_TOOLS();
  window.api.addEventListener("drag-end", dragEndHandler)
  window.api.addEventListener("removed-item", removedItemHandler)

  //Uncomment below to create documents in the database
  //const array = store.updatedCommonTools;
  //const collectionName = "commonTools";
  //await createDocumentsFromArray(array, collectionName);

});

onBeforeUnmount(() => {
  window.api.removeEventListener("drag-end", dragEndHandler)
  window.api.removeEventListener("removed-item", removedItemHandler)
})
//Mounted END
///////////////////////////////////////////////////

</script>

<style scoped>
body {
  overflow: hidden;
}

.dragged-element {
  opacity: 0.5;
  border: 2px dashed #ccc;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  cursor: move;
}


.dragging {
  transform: scale(0.95); /* scale down the card */
  border: 4px dashed rgb(248, 244, 21); /* add a dashed border */
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.5); /* add a shadow effect */
  cursor: move;
}

#start {
  background-color: #e4e01f;
  opacity: 0.3;
  border: none;
  border-radius: 15px 0px 0px 15px;
  color: white;
  padding: 5px 5px;
  text-align: center;
  text-decoration: none;
  font-size: 24px;
  float: right;
}

#start:hover {
  background-color: #e4e01f;
  opacity: 1;
  border: none;
  border-radius: 15px 0px 0px 15px;
  color: white;
  padding: 5px 5px;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
}

.custom-links-card {
  max-height: 305px; /* Adjust the height as needed */
  overflow-y: auto;
}
</style>
