// Styles
import '@fortawesome/fontawesome-free/css/all.css'
import { aliases, fa } from 'vuetify/iconsets/fa-svg'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas, fab, far)
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md3 } from 'vuetify/blueprints'

const myCustomLightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#fffbfe',
    'surface-variant': '#424242',
    primary: '#1E4A7D',
    'on-primary': '#fff',
    'primary-darken-1': '#2e4333',
    secondary: '#F1EDF1',
    'on-secondary': '#000',
    'primary-container': '#004c6a',
    'secondary-darken-1': '#018786',
    'secondary-container': '#384b3c',
    tertiary: '#7d5260',
    error: '#b3261e',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
  }
}

const myCustomDarkTheme = {
  dark: true,
  colors: {
    background: '#191c1e',
    surface: '#191c1e',
    'surface-variant': '#a3a3a3',
    primary: '#80d0ff',
    'primary-darken-1': '#2e4333',
    secondary: '#374955',
    'primary-container': '#004c6a',
    'secondary-darken-1': '#018786',
    'secondary-container': '#384b3c',
    tertiary: '#f3dbc5',
    error: '#ffb4ab',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
  }
}

export default createVuetify({
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: {
      fa,
      fab
    },
  },
  theme: {
    defaultTheme: 'myCustomDarkTheme',
    themes: {
      myCustomLightTheme,
      myCustomDarkTheme
    }
  },
  ssr: true,
  blueprint: md3,
  components,
  directives
})
