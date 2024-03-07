import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
// eslint-disable-next-line
import firebaseApp from './firebase'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.component('FontAwesomeIcon', FontAwesomeIcon) // Register component globally
library.add(fas)

app.use(router);
app.use(pinia);
app.use(vuetify);
app.mount('#app');
