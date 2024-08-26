import { defineStore } from 'pinia'

export const useMyStore = defineStore('ITSDToolsStore', {
  state: () => ({
    configDone: false,
    settingsOverlay: false,
    showCard: {
      communication: true,
      customLinks: true,
      commontools: true,
      remoteassistance: true
    },
    communications: [
      {
        id: 0,
        order: 0,
        label: 'NowIT',
        icon: 'fas fa-home',
        link: 'https://now.ingka.com/nav_to.do?uri=%2Fhome.do%3F',
        iconColor: 'primary',
        browserIcon: 'fab fa-edge',
        showOnPhoneMode: true,
        showOnChatMode: true,
        category: 'communications'
      },
      {
        id: 1,
        order: 1,
        label: 'Knowledge Bases',
        icon: 'fab fa-wikipedia-w',
        link: 'https://now.ingka.com/nav_to.do?uri=%2F$knowledge.do',
        iconColor: 'primary',
        browserIcon: 'fab fa-chrome',
        showOnPhoneMode: true,
        showOnChatMode: true,
        category: 'communications'
      },
      {
        id: 2,
        order: 2,
        label: 'Phone',
        icon: 'fas fa-phone',
        link: 'https://ingka.my.niceincontact.com',
        iconColor: 'primary',
        browserIcon: 'fab fa-chrome',
        showOnPhoneMode: true,
        category: 'communications'
      },
      {
        id: 3,
        order: 3,
        label: 'Chat',
        icon: 'fas fa-message',
        link: 'https://now.ingka.com/now/workspace/agent/inbox',
        iconColor: 'primary',
        browserIcon: 'fab fa-chrome',
        showOnChatMode: true,
        category: 'communications'
      },
      {
        id: 4,
        order: 4,
        label: 'Dashboard',
        icon: 'fas fa-chart-line',
        link: 'https://now.ingka.com/$pa_dashboard.do?sysparm_dashboard=fa4dcfe687a699107d29fd98cebb3591&sysparm_tab=c87d0b2a87a699107d29fd98cebb35b0&sysparm_cancelable=true&sysparm_editable=undefined&sysparm_active_panel=false',
        iconColor: 'primary',
        browserIcon: 'fas fa-atom',
        showOnChatMode: true,
        category: 'communications'
      },
      {
        id: 5,
        order: 5,
        label: 'Dashboard - list',
        icon: 'fas fa-chart-line',
        link: 'https://now.ingka.com/awa_agent_presence_and_availability_list.do?sysparm_query=aca_service_channel%3D4e12dbee1b2e1110d9b1f7c4464bcb91%5EORap_current_presence_state%3D41f9b8dfb31313005baa6e5f26a8dcac%5EORap_current_presence_state%3D39bf853b47b159101a1136dbd36d4311%5Eap_agent%3Dbf33b1391bb0b850157feb11b24bcb18%5EORap_agent%3Ddc6cb7051b34b850157feb11b24bcbb6%5EORap_agent%3D22b45a651bfcbc10157feb11b24bcbdc%5EORap_agent%3D7925279d1b34f410157feb11b24bcb61%5EORap_agent%3Db1c4a9a91b747c10157feb11b24bcb84%5EORap_agent%3De775c1d51b703090157feb11b24bcbd7%5EORap_agent%3D3fde83551b7074d05bdb1f42b24bcbd4%5EORap_agent%3D9694a07d1b347450157feb11b24bcb96%5EORap_agent%3D7fc297c91bb4fc505bdb1f42b24...',
        iconColor: 'primary',
        browserIcon: 'fab fa-chrome',
        showOnChatMode: true,
        category: 'communications',
        removed: true
      }
    ],
    remoteAssistance: [
      {
        id: 0,
        label: 'Remote assistance',
        icon: 'fas fa-computer',
        onClick: 'openRemoteAssistance',
        category: 'remoteAssistance'
      },
      {
        id: 1,
        label: 'Shadow remote',
        icon: 'fas fa-computer',
        onClick: 'openShadowRemote',
        category: 'remoteAssistance'
      },
      {
        id: 2,
        label: 'Quick Assist',
        icon: 'fas fa-computer',
        onClick: 'openQuickAssist',
        category: 'remoteAssistance'
      }
    ],
    commonTools: [],
    updatedCommonTools: [
      {
        id: 0,
        label: 'iAssist',
        icon: 'fas fa-code',
        category: 'commonTools'
      },
      {
        id: 1,
        label: 'PLIPAssist',
        icon: 'fas fa-code',
        category: 'commonTools'
      },
      {
        id: 2,
        label: 'MyIdentity',
        icon: 'fas fa-id-card',
        category: 'commonTools'
      },
      {
        id: 3,
        label: 'eGuides',
        icon: 'fas fa-graduation-cap',
        category: 'commonTools'
      },
      {
        id: 4,
        label: 'Admin Tools (GST)',
        icon: 'fas fa-unlock',
        category: 'commonTools'
      },
    ],
    newCommunicationItem: {
      id: 5,
      order: 5,
      label: 'Dashboard - list',
      icon: 'fas fa-chart-line',
      link: 'https://now.ingka.com/awa_agent_presence_and_availability_list.do?sysparm_query=aca_service_channel%3D4e12dbee1b2e1110d9b1f7c4464bcb91%5EORap_current_presence_state%3D41f9b8dfb31313005baa6e5f26a8dcac%5EORap_current_presence_state%3D39bf853b47b159101a1136dbd36d4311%5Eap_agent%3Dbf33b1391bb0b850157feb11b24bcb18%5EORap_agent%3Ddc6cb7051b34b850157feb11b24bcbb6%5EORap_agent%3D22b45a651bfcbc10157feb11b24bcbdc%5EORap_agent%3D7925279d1b34f410157feb11b24bcb61%5EORap_agent%3Db1c4a9a91b747c10157feb11b24bcb84%5EORap_agent%3De775c1d51b703090157feb11b24bcbd7%5EORap_agent%3D3fde83551b7074d05bdb1f42b24bcbd4%5EORap_agent%3D9694a07d1b347450157feb11b24bcb96%5EORap_agent%3D7fc297c91bb4fc505bdb1f42b24...',
      iconColor: 'primary',
      browserIcon: 'fab fa-chrome',
      showOnChatMode: true,
      category: 'communications',
      removed: true
    },
    itemRenamed: false,
    customLinks: [],
    phoneMode: true,
    isPinned: false,
    theme: 'myCustomLightTheme',
    infoMessage: {
      message: null,
      show: false,
      url: null
    },
    admins: ['philip.nilsson@ingka.ikea.com', 'alexander.hulten@ingka.ikea.com'],
    userLoggedInBefore: false,
    userLoggedIn: false,
    user: null,
    emailSent: false,
    ADUser: {},
    customDarkTheme: {
      primary: null,
      secondary: null,
      tertiary: null
    },
    customLightTheme: {
      primary: null,
      secondary: null,
      tertiary: null
    },
    myDarkThemeTemplate: {
      name: 'Dark - My Custom Theme',
      custom: true,
      colors: {
        primary: '#80d0ff',
        secondary: '#374955',
        tertiary: '#f3dbc5'
      }
    },
    myLightThemeTemplate: {
      name: 'Light - My Custom Theme',
      custom: true,
      colors: {
        primary: '#1E4A7D',
        secondary: '#F1EDF1',
        tertiary: '#7d5260'
      }
    },
    favoriteScripts: [],
    lastRunScripts: [],
    snackbarMessage: '',
    showGeneralSnackbar: false,
    showAbout: false,
  }),
  persist: {
    paths: [
      'browserIconNowIT',
      'browserIconPhone',
      'browserIconChat',
      'theme',
      'customDarkTheme',
      'customLightTheme',
      'myLightThemeTemplate',
      'myDarkThemeTemplate',
      'phoneMode',
      'isPinned',
      'customLinks',
      'showCard',
      'communications',
      'remoteAssistance',
      'commonTools',
      'favoriteScripts',
      'configDone',
      'lastRunScripts',
      'emailSent',
      'userLoggedInBefore',
    ],
  },
  getters: {
    isFavorite: (state) => (scriptId) => {
      return state.favoriteScripts.includes(scriptId)
    },
    getFavoriteScripts: (state) => state.favoriteScripts
  },
  actions: {
    setTheme(theme) {
      this.theme = theme
    },
    updateUser(user) {
      this.ADUser = user
    },
    changeColor({ theme, color, key }) {
      this[theme][key] = color
    },
    resetColors(theme) {
      Object.keys(this[theme]).forEach((i) => (this[theme][i] = null))
    },
    togglePhoneMode(mode) {
      this.phoneMode = mode
    },
    updateBrowserIcon({ index, browserIcon }) {
      this.communications[index].browserIcon = browserIcon
    },
    setCommunications(communications) {
      this.communications = communications
    },
    toggleItemRemovedState({ category, id, value }) {
      let categoryArray
      switch (category) {
        case 'communications':
          categoryArray = this.communications
          break
        case 'remoteAssistance':
          categoryArray = this.remoteAssistance
          break
        case 'commonTools':
          categoryArray = this.commonTools
          break
        default:
          return
      }
      const itemIndex = categoryArray.findIndex((item) => item.id === id.toString())
      if (itemIndex !== -1) {
        const item = categoryArray[itemIndex]
        item.removed = value
      }
    },
    updateBrowserIconCustomLink(index) {
      let value =
        this.customLinks[index].browser === 'fab fa-edge' ? 'fab fa-chrome' : 'fab fa-edge'
      this.customLinks[index].browser = value
    },
    setUserLoggedIn(payload) {
      this.userLoggedIn = payload
    },
    setUser(user) {
      this.user = user
    },
    updateCustomDarkTheme(payload) {
      this.customDarkTheme = payload
    },
    updateInfoMessage(message) {
      this.infoMessage.message = message.message
      this.infoMessage.url = message.url
      this.infoMessage.show = message.show
    },
    toggleIsPinned() {
      this.isPinned = !this.isPinned;
    },
    addCustomLink(newLink) {
      this.customLinks.push(newLink)
    },
    removeCustomLink(index) {
      this.customLinks.splice(index, 1)
    },
    UPDATE_CARD_VISIBILITY(payload) {
      this.showCard[payload.card] = payload.isVisible
    },
    ADD_NEW_ITEM() {
      if (!this.communications.some((item) => item.id === this.newCommunicationItem.id)) {
        this.communications.push(this.newCommunicationItem)
      }
      if (!this.commonTools.some((item) => item.id === this.newCommonToolsItem.id)) {
        this.commonTools.push(this.newCommonToolsItem)
      }
    },
    removeItem(payload) {
      const { array, label } = payload
      this[array] = this[array].filter((item) => item.label !== label)
    },
    RENAME_ITEM(payload) {
      const { stateArray, id, newLabel } = payload
      const index = this[stateArray].findIndex((item) => item.id === id)
      if (index !== -1) {
        this[stateArray][index].label = newLabel
      }
    },
    UPDATE_COMMON_TOOLS() {
      const updatedCommonToolsCopy = JSON.parse(JSON.stringify(this.updatedCommonTools))
      updatedCommonToolsCopy.forEach((updatedTool) => {
        const commonTool = this.commonTools.find((tool) => tool.label === updatedTool.label)
        if (commonTool && commonTool.removed) {
          updatedTool.removed = true
        }
      })
      this.commonTools = updatedCommonToolsCopy
    },
    TOGGLE_FAVORITE(scriptId) {
      const index = this.favoriteScripts.indexOf(scriptId)
      if (index !== -1) {
        this.favoriteScripts.splice(index, 1)
      } else {
        this.favoriteScripts.push(scriptId)
      }
    },
    SET_CONFIG_DONE(value) {
      this.configDone = value
    },
    updateLastRunScripts(scriptDetails) {
      this.lastRunScripts.unshift(scriptDetails)
      this.lastRunScripts = this.lastRunScripts.slice(0, 5)
    },
    storeUser(user) {
      this.user = user
    },
    clearUser() {
      this.user = null
    }
  }
})
