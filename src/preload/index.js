import { contextBridge, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  sendMessage: (message, ...args) => {
    ipcRenderer.send(message, ...args);
  },
  getScreenInfo: async () => {
    return await ipcRenderer.invoke('get-screen-info')
  },
  isWindowMaximized: async () => {
    const { width: screenWidth, height: screenHeight } = await api.getScreenInfo();
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
  
    return windowWidth === screenWidth && windowHeight === screenHeight;
  },
  addEventListener: (eventName, callback = null) => {
    ipcRenderer.on(eventName, (event, data) => {
      if (callback) {
        callback(data);
      }
    });
  },
  navigateRoute: (route) => {
    ipcRenderer.send('navigate-route', route);
  },
  invokeScript: async (scriptToRun, serializedArgs) => {
    const scriptArgs = JSON.parse(serializedArgs);
    try {
      return await ipcRenderer.invoke('run-script', { scriptName: scriptToRun, args: scriptArgs });
    } catch (error) {
      console.error(`Error invoking script "${scriptToRun}" in main process:`, error);
      throw error;
    }
  },
  login: async (email, password) => {
    const response = await ipcRenderer.invoke('login', { email, password });
    return response;
  },
}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
