import { app, shell, BrowserWindow, ipcMain, dialog, screen, Menu, Tray } from 'electron'
import { autoUpdater } from "electron-updater";
import AutoLaunch from "auto-launch";
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import localShortcut from 'electron-localshortcut'
import fs from 'fs/promises'
import { spawn } from 'child_process'
import { checkStatus } from './scripts/idem/checkStatus.js';
import { runGpUpdate } from './scripts/icc4/gpUpdate.js';
import { getMailboxPermissions } from './scripts/exchange/getMailboxPermissions.js';
import { giveMailboxAccess } from './scripts/exchange/giveMailboxAccess.js';
import { removeMailboxAccess } from './scripts/exchange/removeMailboxAccess.js';
import { giveDLAccess } from './scripts/exchange/giveDLAccess.js';
import { removeDLAccess } from './scripts/exchange/removeDLAccess.js';
import { addDLOwners } from './scripts/exchange/addDLOwners.js';
import { installExchangeModule } from './scripts/dependencies/installExchangeModule.js';


// Enable auto-launch
const autoLauncher = new AutoLaunch({
  name: 'ITSD Tools',
  path: join(app.getPath('userData'), '..', '..', 'Local', 'Programs', 'itsdtools', 'itsdtools.exe')
});
autoLauncher.enable();

function setupIPCMainListeners(win, winSettings, winPLIPAssist) {
  win.on('ready-to-show', () => {
    win.show()
  })

  /////////PLIPAssist/////////
  ///////////////////////////////////
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
        case 'gp-update':
          result = await runGpUpdate(args);
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

  /////////REMOTE ASSISTANCE/////////
  ///////////////////////////////////
  //Open remote assistance
  ipcMain.on('open-remote-assistance', () => {
    const child = spawn('cmd.exe', ['/c', 'start', '%windir%\\system32\\msra.exe', '/offerra'])

    child.on('error', (err) => {
      console.error('Error spawning MSRA:', err)
    })

    child.on('exit', (code, signal) => {
      console.log(`MSRA process exited with code ${code} and signal ${signal}`)
    })
  })

  //Open Quick Assist
  ipcMain.on('open-quick-assist', () => {
    const child = spawn('cmd.exe', ['/c', 'start', 'C:\\Windows\\System32\\quickassist.lnk'])

    child.on('error', (err) => {
      console.error('Error spawning MSRA:', err)
    })

    child.on('exit', (code, signal) => {
      console.log(`MSRA process exited with code ${code} and signal ${signal}`)
    })
  })

  //Run RANO
  ipcMain.on('run-rano', (event, computername) => {
    spawn('cmd.exe', [
      '/c',
      'start',
      '%windir%\\system32\\mstsc.exe',
      '/shadow:1',
      '/v:' + computername.trim(),
      '/control'
    ])
  })

  //////////COMMON TOOLS////////////////
  //////////////////////////////////////
  //Open Snipping Tool
  ipcMain.on('open-snipping-tool', () => {
    const child = spawn('cmd.exe', ['/c', 'start', 'snippingtool'])

    child.on('error', (err) => {
      console.error('Error spawning Snipping Tool:', err)
    })

    child.on('exit', (code, signal) => {
      console.log(`Snipping Tool process exited with code ${code} and signal ${signal}`)
    })
  })

  //Open IMU
  ipcMain.on('open-imu', () => {
    const exePath = '"C:\\Program Files\\IKEA Management Tools\\IKEA Management Utility.exe"'
    const child = spawn(exePath, [], {
      windowsHide: true, // Hides the window that would normally open with the spawned process
      shell: true // Required for paths containing spaces
    })

    child.on('error', (err) => {
      console.error('Error occurred while spawning process:', err)
      // Handle error, e.g., send an error message back to the renderer process
    })

    child.on('exit', (code, signal) => {
      console.log(`Child process exited with code ${code} and signal ${signal}`)
    })

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })
  })

  //Open ADUC
  ipcMain.on('open-aduc', () => {
    // Add event parameter
    // Assuming dsa.msc is a valid command in the system
    const child = spawn('dsa.msc', [], {
      windowsHide: true, // Hides the window that would normally open with the spawned process
      shell: true // Required to run commands directly in the shell
    })

    child.on('error', (err) => {
      console.error('Error occurred while spawning process:', err)
      // Handle error, e.g., send an error message back to the renderer process
    })

    child.on('exit', (code, signal) => {
      console.log(`Child process exited with code ${code} and signal ${signal}`)
    })
  })

  //////////UNSORTED////////////////
  //////////////////////////////////////

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
        contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
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
    spawn(browserPath, args, { detached: true })
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

  //Authenticate User
  ipcMain.on('user-logged-in', (event, data) => {
    winSettings.webContents.send('user-logged-in', data)
    winPLIPAssist.webContents.send('user-logged-in', data)
    win.webContents.send('user-logged-in', data)
  })

  ipcMain.on('user-logged-out', () => {
    win.webContents.send('user-logged-out')
    winPLIPAssist.webContents.send('user-logged-out')
    winSettings.webContents.send('user-logged-out')
  })

  ipcMain.on('reload-windows', () => {
    // Reload each window
    if (winSettings) {
      winSettings.reload();
    }
    if (winPLIPAssist) {
      winPLIPAssist.reload();
    }
  });

  //Hide win
  ipcMain.on('minimize', () => {
    win.minimize()
  })

  //Hide winSettings
  ipcMain.on('minimize-winSettings', () => {
    winSettings.hide()
    win.webContents.send('minimize-winSettings')
  })

  //Minimize winPLIPAssist
  ipcMain.on('minimize-winPLIPAssist', () => {
    winPLIPAssist.minimize()
  })

  //Maximize winPLIPAssist
  ipcMain.on('maximize-winPLIPAssist', () => {
    winPLIPAssist.maximize()
  })

  //Return to normal winPLIPAssist
  ipcMain.on('restore-winPLIPAssist', () => {
    winPLIPAssist.setSize(800, 550)
    const winBounds = win.getBounds()
    const screenBounds = screen.getPrimaryDisplay().workArea

    let x = winBounds.x
    let y = winBounds.y

    if (y + winPLIPAssist.getBounds().height > screenBounds.y + screenBounds.height) {
      y = screenBounds.y + screenBounds.height - winPLIPAssist.getBounds().height
    }

    if (x + winPLIPAssist.getBounds().width > screenBounds.x + screenBounds.width) {
      x = screenBounds.x + screenBounds.width - winPLIPAssist.getBounds().width
    }

    winPLIPAssist.setBounds({ x, y })
  })

  //Hide winPLIPAssist
  ipcMain.on('hide-winPLIPAssist', () => {
    winPLIPAssist.hide()
  })

  ipcMain.on('configDone', (event, arg) => {
    // arg will be true
    // send a message to the second window with the new value
    win.webContents.send('configDone', arg)
  })

  //Quit win
  ipcMain.on('quit', () => {
    global.closeApp()
  })

  //Open Devtools
  ipcMain.on('open-devtools', () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => {
      window.webContents.openDevTools()
    })
  })

  //Close Devtools
  ipcMain.on('close-devtools', () => {
    win.webContents.closeDevTools()
  })

  //Open Settings
  ipcMain.on('open-settings', () => {
    winSettings.show()
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
  })

  //Open PLIPAssist
  ipcMain.on('open-PLIPAssist', () => {
    winPLIPAssist.show()
    winPLIPAssist.maximize()
  })

  //Send info to Windows to change the color
  ipcMain.on('change-color', (event, payload) => {
    const { storeThemeName, color, key } = payload
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('color-changed', { storeThemeName, color, key })
      }
    })
  })

  //Send info to Windows to reset theme
  ipcMain.on('reset-color', (event, { storeThemeName }) => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('color-reset', { storeThemeName })
      }
    })
  })

  ipcMain.on('app-version', () => {
    const appVersion = app.getVersion()
        win.webContents.send('app-version', appVersion)

  })

  //Send info to the windows to toggle theme
  ipcMain.on('toggle-theme', (event, data) => {
    const theme = data
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('toggle-theme', theme) // Pass theme directly
      }
    })
  })

  //Toggle Always On Top
  ipcMain.on('toggle-always-on-top', (event, value) => {
    win.setAlwaysOnTop(value)
  })

  //Send info to App.vue to add custom link
  ipcMain.on('addCustomLink', (event, data) => {
    win.webContents.send('addCustomLink', data)
  })

  //Send info to App.vue to remove custom link
  ipcMain.on('removeCustomLink', (event, data) => {
    win.webContents.send('removeCustomLink', data)
  })

  //Send info to App.vue to change browser of custom link
  ipcMain.on('updateBrowserIconCustomLink', (event, data) => {
    win.webContents.send('updateBrowserIconCustomLink', data)
  })

  //Send info to App.vue to show/hide settingOverlay
  ipcMain.on('settingsOverlay', (event, data) => {
    win.webContents.send('settingsOverlay', data)
  })

  //Send info to app.vue about removed item
  ipcMain.on('removed-item', (event, data) => {
    win.webContents.send('removed-item', data)
  })

  //Send info to settingsComponent.vue about added item
  ipcMain.on('added-item', (event, data) => {
    winSettings.webContents.send('added-item', data)
  })

  //Send info to settingsComponent.vue that drag ended
  ipcMain.on('drag-end', () => {
    winSettings.webContents.send('drag-end')
    win.webContents.send('drag-end')
  })

  //Send info to settingsComponent.vue to show add custom link
  ipcMain.on('show-add-custom-link', () => {
    winSettings.webContents.send('show-add-custom-link')
  })
}

function createWindow() {
  // General window settings
  const browserWindowOptions = {
    icon: icon,
    minWidth: 400,
    skipTaskbar: false,
    movable: true,
    resizable: true,
    alwaysOnTop: false,
    opacity: 1,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    transparent: true,
    frame: false,
    webPreferences: {
      devTools: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  }
  const dimensions = {
    win: { width: 780, height: 545 },
    winSettings: { width: 500, height: 670 },
    winPLIPAssist: { width: 800, height: 550 }
  }

  // Create the browser window.
  const win = new BrowserWindow({
    ...browserWindowOptions,
    ...dimensions.win,
    title: 'Main Window',
    minWidth: 710,
    maxHeight: 545
  })
  const winSettings = new BrowserWindow({
    ...browserWindowOptions,
    ...dimensions.winSettings,
    title: 'Settings Window',
    skipTaskbar: true,
    alwaysOnTop: true,
    minWidth: 440
  })
  const winPLIPAssist = new BrowserWindow({
    ...browserWindowOptions,
    ...dimensions.winPLIPAssist,
    title: 'PLIPAssist Window',
    skipTaskbar: false,
    alwaysOnTop: false,
    minWidth: 340
  })

  // Hide settings and about windows
  winSettings.hide()
  winPLIPAssist.hide()
  Menu.setApplicationMenu(null) 

  //Add function from ipcMainHandlers.js for the ipc listeners
  setupIPCMainListeners(win, winSettings, winPLIPAssist)

  // Register shortcuts
  ;[win, winSettings, winPLIPAssist].forEach((window) => {
    localShortcut.register(window, 'F12', () => {
      window.webContents.openDevTools()
    })
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the appropriate URL based on environment
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Use the provided renderer URL in development mode
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
    winSettings.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/settings`);
    winPLIPAssist.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/plipassist`);
  } else {
    // Load the local HTML file in production mode
    win.loadFile(join(__dirname, '../renderer/index.html'));
    winSettings.loadFile(join(__dirname, '../renderer/index.html'));
    winPLIPAssist.loadFile(join(__dirname, '../renderer/index.html'));

   winPLIPAssist.webContents.on('did-finish-load', () => {
    winPLIPAssist.webContents.send('navigate-route', '/plipassist');
    });

    winSettings.webContents.on('did-finish-load', () => {
      winSettings.webContents.send('navigate-route', '/settings');
    });
  }   

  // Tray
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

  //Autoupdater
  win.webContents.once("did-finish-load", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

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
    // Prompt the user for confirmation before installing
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

  createWindow()

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
