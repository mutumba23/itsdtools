<template>
  <!--Snackbar--><v-snackbar
    v-model="showSnackbar"
    :timeout="3000"
    color="secondary"
    location="top"
    rounded="pill"
  >
    {{ snackbarText }}
  </v-snackbar>

  <v-alert type="info" density="compact" class="mx-1 mt-1">Drag and drop to hide items</v-alert>

  <v-container
    id="trashbin"
    class="d-flex flex-wrap justify-center pa-0"
    dropzone="container"
    @drop="drop"
    @dragenter="dragEnter"
    @dragend="dragEnd"
    @dragover.prevent
  >
    <!--Communication-->
    <v-card
      id="communication"
      min-height="200"
      flat
      class="flex-grow-1 bg-secondary ma-1 pb-4"
      dropzone="communication"
      @drop="drop"
      @dragenter="dragEnter"
      @dragend="dragEnd"
      @dragover.prevent
    >
      <v-card-title
        >Communication<v-icon class="float-right" size="x-small">fas fa-trash</v-icon></v-card-title
      >

      <template v-for="communication in sortedCommunications" :key="communication.label">
        <v-row class="flex-nowrap">
          <v-btn
            class="mx-2 flex-grow-1 justify-start animate__animated animate__backInUp"
            style="text-transform: none"
            size="large"
            :prepend-icon="communication.icon"
            variant="text"
            draggable="true"
            @dragstart="dragStart($event, communication)"
          >
            {{ communication.label }}
          </v-btn>
        </v-row>
      </template>
    </v-card>
    <!--Common tools-->
    <v-card
      id="commonTools"
      min-height="200"
      flat
      class="flex-grow-1 ma-1 pb-4 bg-secondary"
      dropzone="commonTools"
      @drop="drop"
      @dragenter="dragEnter"
      @dragend="dragEnd"
      @dragover.prevent
    >
      <v-card-title
        >Common tools<v-icon class="float-right" size="x-small">fas fa-trash</v-icon></v-card-title
      >

      <template v-for="commonTools in sortedCommonTools" :key="commonTools.label">
        <v-row class="flex-nowrap">
          <v-btn
            class="mx-2 flex-grow-1 justify-start animate__animated animate__backInUp"
            style="text-transform: none"
            size="large"
            :prepend-icon="commonTools.icon"
            variant="text"
            draggable="true"
            @dragstart="dragStart($event, commonTools)"
          >
            {{ commonTools.label }}
          </v-btn>
        </v-row>
      </template>
    </v-card>
    <!--Remote Assistance-->
    <v-card
      id="remoteassistancecard"
      min-height="100"
      flat
      class="flex-grow-1 ma-1 pb-4 bg-secondary"
      dropzone="remoteAssistance"
      @drop="drop"
      @dragenter="dragEnter"
      @dragend="dragEnd"
      @dragover.prevent
    >
      <v-card-title
        >Remote Assistance<v-icon class="float-right" size="x-small"
          >fas fa-trash</v-icon
        ></v-card-title
      >

      <template v-for="remoteAssistance in sortedRemoteAssistance" :key="remoteAssistance.label">
        <v-row class="flex-nowrap">
          <v-btn
            class="mx-2 flex-grow-1 justify-start animate__animated animate__backInUp"
            style="text-transform: none"
            size="large"
            :prepend-icon="remoteAssistance.icon"
            variant="text"
            draggable="true"
            @dragstart="dragStart($event, remoteAssistance)"
          >
            {{ remoteAssistance.label }}
          </v-btn>
        </v-row>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMyStore } from '@/stores/items.js'
import { getDocumentFromCollection, updateUserDocumentArrayItem } from '../firebase.js'
const store = useMyStore()
const showSnackbar = ref(false)
const snackbarText = ref('')
const userCommonTools = ref([])
const userCommunications = ref([])
const userRemoteAssistance = ref([])

const sortedCommunications = computed(() => {
  return userCommunications.value
    .filter((communication) => communication.removed)
    .sort((a, b) => a.order - b.order)
})
const sortedRemoteAssistance = computed(() => {
  return userRemoteAssistance.value.filter((remoteAssistance) => remoteAssistance.removed)
})
const sortedCommonTools = computed(() => {
  return userCommonTools.value.filter((commonTools) => commonTools.removed)
})
const drop = async (event) => {
  const data = event.dataTransfer.getData('application/json')
  const draggedObject = JSON.parse(data)

  switch (draggedObject.category) {
    case 'communications': {
      await updateUserDocumentArrayItem('users', store.user.uid, 'communications', draggedObject.id, true);
      const communications = await fetchUserArray('communications');
      userCommunications.value = communications;
      window.api.sendMessage('removed-item', draggedObject)
      break
    }
    case 'remoteAssistance': {
      await updateUserDocumentArrayItem('users', store.user.uid, 'remoteAssistance', draggedObject.id, true);
      const remoteAssistance = await fetchUserArray('remoteAssistance');
      userRemoteAssistance.value = remoteAssistance;
      window.api.sendMessage('removed-item', draggedObject)
      break
    }
    case 'commonTools': {
      await updateUserDocumentArrayItem('users', store.user.uid, 'commonTools', draggedObject.id, true);
      const commonTools = await fetchUserArray('commonTools');
      userCommonTools.value = commonTools;
      window.api.sendMessage('removed-item', draggedObject)
      break
    }
    default:
      showSnackbar.value = true
      snackbarText.value = 'Something went wrong'
      break
  }
}
const dragStart = (event, item) => {
  event.dataTransfer.setData('application/json', JSON.stringify(item))
  event.target.classList.add('dragging');
}
const dragEnter = () => {
  const trashbin = document.getElementById('trashbin')
  trashbin.classList.add('dragging')
}
const dragEnd = (event) => {
  event.target.classList.remove('dragging')
  const trashbin = document.getElementById('trashbin')
  trashbin.classList.remove('dragging')
  window.api.sendMessage('drag-end')
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
///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(async () => {
  const trashbin = document.getElementById('trashbin')

  window.api.addEventListener('added-item', async (data) => {
    switch (data.category) {
      case 'communications': {
        await updateUserDocumentArrayItem('users', store.user.uid, 'communications', data.id, false);
        const communications = await fetchUserArray('communications');
        userCommunications.value = communications;
        break
      }
      case 'remoteAssistance': {
        await updateUserDocumentArrayItem('users', store.user.uid, 'remoteAssistance', data.id, false);
        const remoteAssistance = await fetchUserArray('remoteAssistance');
        userRemoteAssistance.value = remoteAssistance;
        break
      }
      case 'commonTools': {
        await updateUserDocumentArrayItem('users', store.user.uid, 'commonTools', data.id, false);
        const commonTools = await fetchUserArray('commonTools');
        userCommonTools.value = commonTools;
        break
      }
      default:
        console.log('Matchar ej')
        break
    }

    trashbin.classList.remove('dragging')
  })

  window.api.addEventListener('drag-end', () => {
    trashbin.classList.remove('dragging')
  })

  // Fetch the user document
  const commonTools = await fetchUserArray('commonTools');
  const communications = await fetchUserArray('communications');
  const remoteAssistance = await fetchUserArray('remoteAssistance');
  userCommonTools.value = commonTools;
  userCommunications.value = communications;
  userRemoteAssistance.value = remoteAssistance;
})
//Mounted END
///////////////////////////////////////////////////
</script>

<style scoped>
.dragging {
  transform: scale(0.95); /* scale down the card */
  border: 4px dashed rgb(248, 244, 21); /* add a dashed border */
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.5); /* add a shadow effect */
}
</style>
2
