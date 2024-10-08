import { app, shell, BrowserWindow, ipcMain, dialog, screen, Menu, Tray } from 'electron'
import { autoUpdater } from "electron-updater";
import AutoLaunch from "auto-launch";
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import localShortcut from 'electron-localshortcut'
import fs from 'fs/promises'
import { spawn } from 'child_process'
//import { runIDEM } from './scripts/idem/runIDEM.js';
import { checkStatus } from './scripts/idem/checkStatus.js';
//import { runGpUpdate } from './scripts/icc4/gpUpdate.js';
import { getMailboxPermissions } from './scripts/exchange/getMailboxPermissions.js';
import { giveMailboxAccess } from './scripts/exchange/giveMailboxAccess.js';
import { removeMailboxAccess } from './scripts/exchange/removeMailboxAccess.js';
import { giveDLAccess } from './scripts/exchange/giveDLAccess.js';
import { removeDLAccess } from './scripts/exchange/removeDLAccess.js';
import { addDLOwners } from './scripts/exchange/addDLOwners.js';
import { installExchangeModule } from './scripts/dependencies/installExchangeModule.js';
import { exec } from 'child_process';
import os from 'os';

// Function to detect if running in a VDI environment
function isRunningInVDI() {
  const sessionName = process.env.SESSIONNAME || '';
  const clientName = process.env.CLIENTNAME || '';
  const term = process.env.TERM || '';
  const hostname = os.hostname();
  const vdiIndicators = ['ICA', 'RDP-Tcp', 'X11', 'SSH'];

  console.log('HOSTNAME:', hostname);

  // Check if hostname starts with ITINECU
  if (hostname.startsWith('ITIN')) {
    return true;
  }

  // Check environment variables
  return vdiIndicators.some(indicator => sessionName.startsWith(indicator) || clientName.includes(indicator) || term.includes(indicator));
}

// Disable hardware acceleration and transparency if running in a VDI
let isTransparent = true;
if (isRunningInVDI()) {
  console.log('VDI environment detected. Disabling transparency and GPU acceleration.');
  app.disableHardwareAcceleration();
  isTransparent = false;
} else {
  console.log('Not running in a VDI environment. Transparency and GPU acceleration enabled.');
}

// Enable auto-launch
const autoLauncher = new AutoLaunch({
  name: 'ITSD Tools',
  path: join(app.getPath('userData'), '..', '..', 'Local', 'Programs', 'itsdtools', 'itsdtools.exe')
});
autoLauncher.enable();

//Helper functions
function loadURL(window, route = '') {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Use the provided renderer URL in development mode
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${route}`);
  } else {
    // Load the local HTML file in production mode
    window.loadFile(join(__dirname, '../renderer/index.html'));

    if (route) {
      window.webContents.on('did-finish-load', () => {
        window.webContents.send('navigate-route', route);
      });
    }
  } 
}

function setupTray() {
  const tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Display Toolbar",
      click: () => {
        win.show();
      },
    },
    { type: "separator" },
    {
      label: `Version: ${app.getVersion()}`,
    },
    {
      label: "Quit",
      click: () => {
        global.closeApp();
      },
    },
  ]);
  tray.setToolTip("ITSD Tools");
  tray.setContextMenu(contextMenu);
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
  })
  autoUpdater.on('update-available', () => {
    console.log('Update available.')
  })
  autoUpdater.on('update-not-available', () => {
    console.log('Update not available.')
  })
  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater. ' + err)
  })
  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded')
  });

  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Update available',
      message: `A new update is available.`
    };
  
    const response = dialog.showMessageBoxSync(null, dialogOpts);
  
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
  console.log('AutoUpdater setup completed');
}

function registerShortcuts(window) {
  localShortcut.register(window, 'F12', () => {
    window.webContents.openDevTools({ mode: 'right' })
  })
}


function handleWindowOpen(window) {
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, options)

  child.on('error', (err) => {
    console.error(`Error spawning ${command}:`, err)
  })

  child.on('exit', (code, signal) => {
    console.log(`${command} process exited with code ${code} and signal ${signal}`)
  })

  return child
}

function sendToAllWindows(channel, message) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, message)
    }
  })
}

function manageWindow(window, action) {
  switch (action) {
    case 'show':
      window.show()
      break
    case 'hide':
      window.hide()
      break
    case 'minimize':
      window.minimize()
      break
    case 'maximize':
      window.maximize()
      break
    default:
      console.error(`Unsupported action: ${action}`)
  }
}

function sendMessageToWindow(window, channel, message) {
  if (!window.isDestroyed()) {
    window.webContents.send(channel, message)
  }
}

//Setup Main listeners
function setupMainWindowIPCListeners() {
  //Open with GST account
  function openAppWithCredentials(event, appName, appPath, args) {
    const user = `${process.env.USERDOMAIN}\\GST${process.env.username}`;
    const argsString = args ? ` -ArgumentList \\"'${args.join(' ')}'\\"` : '';
    exec(`cmdkey /list | findstr ${user}`, (error, stdout, stderr) => {
      if (error || stderr || !stdout) {
        console.log(`No saved credentials found for user: ${user}`);
        event.reply(`${event}-response`, { message: 'No saved credentials found', error: error ? error.message : null, stdout, stderr });
        return;
      }
      console.log(`Saved credentials found for user: ${user}`);
      const command = `runas /user:${user} /savecred "powershell -c start-process -FilePath \\"'${appPath}'\\"${argsString} -verb runAs"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          event.reply(`${event}-response`, { message: 'Error executing command', error: error.message, stdout, stderr });
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          event.reply(`${event}-response`, { message: 'Command executed with errors', error: null, stdout, stderr });
          return;
        }
        console.log(`stdout: ${stdout}`);
        event.reply(`${event}-response`, { message: 'Command executed successfully', error: null, stdout, stderr });
      });
    });
  }

// Open IMU
ipcMain.on('open-imu', (event) => {
  openAppWithCredentials(event, 'imu', 'C:\\Program Files\\IKEA Management Tools\\IKEA Management Utility.exe');
});

// Open ADUC
ipcMain.on('open-aduc', (event) => {
  openAppWithCredentials(event, 'aduc', 'dsa.msc');
});

//Open Remote Assistance
ipcMain.on('open-remote-assistance', (event) => {
  openAppWithCredentials(event, 'remote-assistance', '%windir%\\system32\\msra.exe', ['/offerra']);
});

// Open GST account shortcuts share
ipcMain.on('open-gstShare', (event) => {
  const command = `explorer.exe \\\\ITSEELM-NT0007.ikea.com\\Common_C\\IOS-SA DPOP training\\Helpdesk\\ihu\\lhul`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      event.reply(`${event}-response`, { message: 'Error executing command', error: error.message, stdout, stderr });
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      event.reply(`${event}-response`, { message: 'Command executed with errors', error: null, stdout, stderr });
      return;
    }
    console.log(`stdout: ${stdout}`);
    event.reply(`${event}-response`, { message: 'Command executed successfully', error: null, stdout, stderr });
  });
});

//Run RANO
ipcMain.on('run-rano', (event, computername) => {
  openAppWithCredentials(event, 'rano', '%windir%\\system32\\mstsc.exe', ['/shadow:1', '/v:' + computername.trim(), '/control']);
});

//Open Quick Assist
ipcMain.on('open-quick-assist', () => {
  spawnProcess('cmd.exe', ['/c', 'start', 'C:\\Windows\\System32\\quickassist.lnk'])
})


//Open Snipping Tool
ipcMain.on('open-snipping-tool', () => {
  spawnProcess('cmd.exe', ['/c', 'start', 'snippingtool'])
})

  //Open External Link
  ipcMain.on('open-external-link', async (event, link, browser, options) => {
    let browserPath = ''
    let args = [link]
    switch (browser) {
      case 'fab fa-chrome':
        browserPath = await findChromePath()
        if (options.incognito) {
          args.unshift('--incognito')
        }
        break
      default:
        browserPath = await findEdgePath()
        if (options.incognito) {
          args.unshift('--inprivate') // For Edge
        }
        break
    }
  
    // Spawn the browser process
    spawnProcess(browserPath, args, { detached: true })
  })

  // Function to find the Chrome path
  async function findChromePath() {
    let chromePath = ''

    if (
      await fs
        .access('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
        .then(() => true)
        .catch(() => false)
    ) {
      chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } else if (
      await fs
        .access('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')
        .then(() => true)
        .catch(() => false)
    ) {
      chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    }

    return chromePath
  }

  // Function to find the Edge path
  async function findEdgePath() {
    let edgePath = ''

    if (
      await fs
        .access('C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe')
        .then(() => true)
        .catch(() => false)
    ) {
      edgePath = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    } else if (
      await fs
        .access('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
        .then(() => true)
        .catch(() => false)
    ) {
      edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    }

    return edgePath
  }

  //Hide win
  ipcMain.on('minimize', () => {
    win.minimize()
  })

  ipcMain.on('configDone', (event, arg) => {
    // arg will be true
    // send a message to the second window with the new value
    win.webContents.send('configDone', arg)
  })

  ipcMain.on('app-version', () => {
    const appVersion = app.getVersion()
        win.webContents.send('app-version', appVersion)

  })

  //Toggle Always On Top
  ipcMain.on('toggle-always-on-top', (event, value) => {
    win.setAlwaysOnTop(value)
  })

  //Send info to App.vue to add custom link
  ipcMain.on('addCustomLink', (event, data) => {
    sendMessageToWindow(win, 'addCustomLink', data)
  })

  //Send info to App.vue to remove custom link
  ipcMain.on('removeCustomLink', (event, data) => {
    sendMessageToWindow(win, 'removeCustomLink', data)
  })

  //Send info to App.vue to change browser of custom link
  ipcMain.on('updateBrowserIconCustomLink', (event, data) => {
    sendMessageToWindow(win, 'updateBrowserIconCustomLink', data)
  })

  //Send info to App.vue to show/hide settingOverlay
  ipcMain.on('settingsOverlay', (event, data) => {
    sendMessageToWindow(win, 'settingsOverlay', data)
  })

  //Send info to app.vue about removed item
  ipcMain.on('removed-item', (event, data) => {
    sendMessageToWindow(win, 'removed-item', data)
  })

}

function setupSharedIPCMainListeners() {
  //Get Screen Info
  ipcMain.handle('get-screen-info', () => {
    // Get the primary display's size
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    // Return the screen information to the renderer process
    return { width, height }
  })

   //Open New Window
   ipcMain.on('open-new-window', (event, windowOptions) => {
    let newWindow = new BrowserWindow({
      width: windowOptions.width,
      height: windowOptions.height,
      x: windowOptions.x,
      y: windowOptions.y,
      frame: true,
      webPreferences: {
        // Define your content security policy here
        contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self';"
    }
    })

    newWindow.loadURL(
      'https://now.ingka.com/$pa_dashboard.do?sysparm_dashboard=fa4dcfe687a699107d29fd98cebb3591&sysparm_tab=c87d0b2a87a699107d29fd98cebb35b0&sysparm_cancelable=true&sysparm_editable=undefined&sysparm_active_panel=false'
    )

    // Create a template for your custom menu
    const template = []

    // Create the menu from the template
    const menu = Menu.buildFromTemplate(template)

    // Set the menu to be displayed in the window
    newWindow.setMenu(menu)

    newWindow.on('closed', () => {
      newWindow = null
    })
  })

  //Authenticate User
  ipcMain.on('user-logged-in', (event, data) => {
    sendToAllWindows('user-logged-in', data)
  })

  ipcMain.on('user-logged-out', () => {
    sendToAllWindows('user-logged-out', {})
  })

  //Reload winSettings and winPLIPAssist
  ipcMain.on('reload-windows', () => {
    if (winSettings) {
      winSettings.reload();
    }
    if (winPLIPAssist) {
      winPLIPAssist.reload();
    }
  });

  //Quit win
  ipcMain.on('quit', () => {
    global.closeApp()
  })

  //Send info to Windows to change the color
  ipcMain.on('change-color', (event, payload) => {
    const { storeThemeName, color, key } = payload
    sendToAllWindows('color-changed', { storeThemeName, color, key })
  })

  //Send info to Windows to reset theme
  ipcMain.on('reset-color', (event, { storeThemeName }) => {
    sendToAllWindows('color-reset', { storeThemeName })
  })

  //Send info to the windows to toggle theme
  ipcMain.on('toggle-theme', (event, theme) => {
    sendToAllWindows('toggle-theme', theme)
  })

  //Send info to settingsComponent.vue that drag ended
  ipcMain.on('drag-end', () => {
    if (winSettings) {
      winSettings.webContents.send('drag-end')
    }
    win.webContents.send('drag-end')
  })

}

function setupPLIPAssistWindowIPCListeners() {
  //Run Script
  ipcMain.handle('run-script', async (event, { scriptName, args }) => {
    try {
      let result;
      switch (scriptName) {
        case 'install-exchange-module':
         result = await installExchangeModule(args);
          break;
        case 'check-status':
          result = await checkStatus(args);
          break;
        case 'get-mailbox-permissions':
          result = await getMailboxPermissions(args);
          break;
        case 'give-mailbox-access':
          result = await giveMailboxAccess(args);
          break;
        case 'remove-user-mailbox-access':
          result = await removeMailboxAccess(args);
          break;
        case 'give-dl-access':
          result = await giveDLAccess(args);
          break;
        case 'remove-dl-access':
          result = await removeDLAccess(args);
          break;
        case 'add-dl-owners':
          result = await addDLOwners(args);
          break;
        default:
          throw new Error(`Unsupported script: ${scriptName}`);
      }
      console.log(result);
      return result;
    } catch (error) {
      console.error(`Error running ${scriptName} script:`, error);
      return error;
    }
  });

  //Open PLIPAssist
  ipcMain.on('open-PLIPAssist', () => {
    manageWindow(winPLIPAssist, 'show')
    manageWindow(winPLIPAssist, 'maximize')
  })

   //Minimize winPLIPAssist
   ipcMain.on('minimize-winPLIPAssist', () => {
    manageWindow(winPLIPAssist, 'minimize')
  })

  //Maximize winPLIPAssist
  ipcMain.on('maximize-winPLIPAssist', () => {
    manageWindow(winPLIPAssist, 'maximize')
  })

  //Hide winPLIPAssist
  ipcMain.on('hide-winPLIPAssist', () => {
    manageWindow(winPLIPAssist, 'hide')
  })

}

function setupSettingsWindowIPCListeners() {
   //Open Settings
   ipcMain.on('open-settings', () => {
    // winSettings = createSettingsWindow()
     const winBounds = win.getBounds()
     const screenBounds = screen.getPrimaryDisplay().workArea
     const settingsBounds = winSettings.getBounds()
   
     let x, y
     const gap = 10;
   
     // If the secondary window goes off the right edge of the screen, check if it fits on the left
     if (winBounds.x + winBounds.width + settingsBounds.width + gap > screenBounds.x + screenBounds.width) {
       if (winBounds.x - settingsBounds.width - gap < screenBounds.x) {
         // If it doesn't fit on the left either, place it at the very far right side of the screen
         x = screenBounds.x + screenBounds.width - settingsBounds.width
       } else {
         // If it fits on the left, place it to the left of win
         x = winBounds.x - settingsBounds.width - gap
       }
     } else {
       x = winBounds.x + winBounds.width + gap
     }
   
     // If the secondary window goes off the bottom edge of the screen, adjust y
     if (winBounds.y + settingsBounds.height > screenBounds.y + screenBounds.height) {
       y = screenBounds.y + screenBounds.height - settingsBounds.height
     } else {
       y = winBounds.y
     }
   
     winSettings.setBounds({ x, y })
     manageWindow(winSettings, 'show')
   })

  //Hide winSettings
  ipcMain.on('minimize-winSettings', () => {
    manageWindow(winSettings, 'hide')
    sendMessageToWindow(win, 'settingsOverlay', false)
  })

  //Send info to settingsComponent.vue about added item
  ipcMain.on('added-item', (event, data) => {
    sendMessageToWindow(winSettings, 'added-item', data)
  })

  //Send info to settingsComponent.vue to show add custom link
  ipcMain.on('show-add-custom-link', () => {
    const winBounds = win.getBounds()
     const screenBounds = screen.getPrimaryDisplay().workArea
     const settingsBounds = winSettings.getBounds()
   
     let x, y
     const gap = 10;
   
     // If the secondary window goes off the right edge of the screen, check if it fits on the left
     if (winBounds.x + winBounds.width + settingsBounds.width + gap > screenBounds.x + screenBounds.width) {
       if (winBounds.x - settingsBounds.width - gap < screenBounds.x) {
         // If it doesn't fit on the left either, place it at the very far right side of the screen
         x = screenBounds.x + screenBounds.width - settingsBounds.width
       } else {
         // If it fits on the left, place it to the left of win
         x = winBounds.x - settingsBounds.width - gap
       }
     } else {
       x = winBounds.x + winBounds.width + gap
     }
   
     // If the secondary window goes off the bottom edge of the screen, adjust y
     if (winBounds.y + settingsBounds.height > screenBounds.y + screenBounds.height) {
       y = screenBounds.y + screenBounds.height - settingsBounds.height
     } else {
       y = winBounds.y
     }
   
     winSettings.setBounds({ x, y })
     manageWindow(winSettings, 'show')
    sendMessageToWindow(winSettings, 'show-add-custom-link', {})
  })
}

//Create the windows
let win
function createWindow(isTransparent) {
  // Create the browser window.
  win = new BrowserWindow({
    title: 'Main Window',
    minWidth: 710,
    maxHeight: 545, // 545 default
    width: 780,
    height: 545, // 545 default 500 good with VDI
    icon: icon,
    skipTaskbar: false,
    movable: true,
    resizable: true,
    alwaysOnTop: false,
    opacity: 1,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    transparent: isTransparent,
    frame: false,
    webPreferences: {
      devTools: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Set menu to null
  Menu.setApplicationMenu(null) 

  // Register shortcuts
  registerShortcuts(win)

  //Make sure external links are opened in users default browser instead of in Electron
  handleWindowOpen(win)

  // Load the appropriate URL based on environment
  loadURL(win)  

  // Tray
  setupTray()

  win.on('ready-to-show', () => {
    win.show()
  })

  //Autoupdater
  win.webContents.once("did-finish-load", () => {
    autoUpdater.checkForUpdatesAndNotify();
    setupAutoUpdater()
  });
  
  return win;
}

let winSettings
function createSettingsWindow(isTransparent) {
  if (!winSettings) {
  winSettings = new BrowserWindow({
    title: 'Settings Window',
    minWidth: 400,
    width: 500,
    height: 670,
    skipTaskbar: true,
    icon: icon,
    movable: true,
    resizable: true,
    alwaysOnTop: true,
    opacity: 1,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    transparent: isTransparent,
    frame: false,
    webPreferences: {
      devTools: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  //Open Devtools with F12 function
  registerShortcuts(winSettings)

  //Prevent new windows from being opened. Instead påen them in the default browser
  handleWindowOpen(winSettings)

  // Load the appropriate URL based on environment
  loadURL(winSettings, '/settings')
}

  winSettings.hide()
  return winSettings;
}

let winPLIPAssist
function createPLIPAssistWindow(isTransparent) {
  if (!winPLIPAssist) {
    winPLIPAssist = new BrowserWindow({
      title: 'PLIPAssist Window',
      skipTaskbar: false,
      alwaysOnTop: false,
      minWidth: 400,
      width: 800,
      height: 550,
      icon: icon,
      movable: true,
      resizable: true,
      opacity: 1,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      transparent: isTransparent,
      frame: false,
      webPreferences: {
        devTools: true,
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    //Open Devtools with F12 function
    registerShortcuts(winPLIPAssist)

    //Prevent new windows from being opened. Instead påen them in the default browser
    handleWindowOpen(winPLIPAssist)

    // Load the appropriate URL based on environment
    loadURL(winPLIPAssist, '/plipassist')
  }
  
  winPLIPAssist.hide()
  return winPLIPAssist;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

   // Create windows
   win = createWindow(isTransparent);
   winSettings = createSettingsWindow(isTransparent);
   winPLIPAssist = createPLIPAssistWindow(isTransparent);
 
   setupSharedIPCMainListeners();
   setupMainWindowIPCListeners();
   setupSettingsWindowIPCListeners();
   setupPLIPAssistWindowIPCListeners();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// Close the app function (check if script is loading before closing the app)
let scriptLoading = false
ipcMain.on('isLoading', (event, isLoading) => {
  scriptLoading = isLoading
})
global.closeApp = function () {
  if (scriptLoading) {
    const messageBoxOptions = {
      type: 'warning',
      title: 'Script Loading',
      message: 'A script is currently loading. Do you want to close the application anyway?',
      buttons: ['Close Anyway', 'Wait'],
      defaultId: 0
    }
    dialog.showMessageBox(null, messageBoxOptions).then((result) => {
      if (result.response === 0) {
        app.quit()
      }
    })
  } else if (process.platform !== 'darwin') {
    app.quit()
  }
}

ipcMain.on('quit-app', () => {
  global.closeApp()
})

app.on('window-all-closed', () => {
  global.closeApp()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
