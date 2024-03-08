<template>
  <v-app-bar density="compact" color="tertiary" class="ma-0 drag" rounded>
    <v-app-bar-title>Version: {{appVersion}}<v-btn @click="showVersionHistory = true">Version History</v-btn></v-app-bar-title>
    <template #append>
      <v-btn
        color="on-tertiary"
        icon="fas fa-xmark"
        @click="store.showAbout = false"
      ></v-btn>
    </template>
  </v-app-bar>

  <v-snackbar
    v-model="showSnackbar"
    :timeout="5000"
    color="secondary"
    location="bottom"
  >
    {{ snackbarMessage }}
  </v-snackbar>

  <v-dialog v-model="showVersionHistory"  scrollable>
    <v-card flat>
        <template #append>
            <v-btn
                icon="fas fa-xmark"
                color="on-tertiary"
                @click="showVersionHistory = false"
            ></v-btn>
            </template>
          <v-card-title>Version history</v-card-title>
          <v-card-text style="height: 100%;" class="show-scrollbar">
          <v-expansion-panels>
            <v-expansion-panel v-for="release in releases" :key="release.id">
              <v-expansion-panel-title
                >{{ release.name }}
              </v-expansion-panel-title>
              <v-expansion-panel-text
                ><div>
                      <ul>
                        <li v-for="line in release.body.split('\n')" :key="line">
                          {{ line.replace(/^\* /, '') }}
                        </li>
                      </ul>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        </v-card>
  </v-dialog>

  <v-sheet class="ma-0 pa-0 w-100 h-100" style="overflow-y: auto">

        <v-carousel>
            <v-carousel-item
                src="./about_1024.png?asset"
                cover
            ></v-carousel-item>

            <v-carousel-item>
                <v-sheet
                height="100%"
                class="d-flex align-center"
              >
                    <v-card flat class="d-flex flex-column  justify-center align-center mx-16">
                        <v-card-title>About ITSD Tools</v-card-title>
                        <v-card-subtitle>Introducing our all-in-one IT Service Desk app!</v-card-subtitle>
                        <v-card-text>
                        Streamline your daily tasks with quick access to essential tools such as remote assistance, chat and phone systems, and other common applications. With the ability to customize your browser preferences for each link, you'll save time and work more efficiently. Stay informed with real-time broadcast messages directly within the app.
                        </v-card-text>

                        <v-card-subtitle>Powering a Modern, Cross-Platform Desktop App with Electron and Vue.js</v-card-subtitle>
                        <v-card-text>
                            Our IT Service Desk app is built using Electron, a popular framework for building cross-platform desktop applications using web technologies such as HTML, CSS, and JavaScript. We also utilized Vue.js, a progressive JavaScript framework for building user interfaces, to create a modern and responsive user experience.
                        </v-card-text>
                    </v-card>
                </v-sheet>
            </v-carousel-item>
        </v-carousel>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from "axios";
import { useTheme } from 'vuetify'
import { useMyStore } from '@/stores/items.js'
const store = useMyStore()
const theme = useTheme()
const showSnackbar = ref(false)
const showVersionHistory = ref(false)
const snackbarMessage = ref('')
const latestRelease = ref(null)
const releases = ref([])
const appVersion = ref('')

onMounted(() => {
  window.api.addEventListener("toggle-theme", (data) => {
    theme.global.name.value =
        theme.global.name.value === "myCustomLightTheme"
          ? "myCustomDarkTheme"
          : "myCustomLightTheme";
      const themeName = data;
      theme.global.name.value = themeName;
      store.setTheme(themeName);
  });

  window.api.addEventListener("app-version", (data) => {
    appVersion.value = data;
  });

  window.api.sendMessage('app-version');

  axios
      .get("https://api.github.com/repos/mutumba23/itsdtools/releases")
      .then((response) => {
        releases.value = response.data.sort((a, b) => {
        return new Date(b.published_at) - new Date(a.published_at);
      });

        const latestGithubRelease = releases.value[0];
        latestRelease.value = latestGithubRelease.name;
      })
      .catch((error) => {
        console.log(error);
      });
});



</script>

<style scoped>
ul li {
  list-style-type: disc;
}
/* unvisited link */
a:link {
  color: white;
  text-decoration: none;
}

/* visited link */
a:visited {
  color: white;
  text-decoration: none;
}

/* mouse over link */
a:hover {
  color: white;
  text-decoration: underline;
}

/* selected link */
a:active {
  color: white;
  text-decoration: underline;
}
</style>
