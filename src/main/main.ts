/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import pm2 from '@elife/pm2';
import propertiesReader from 'properties-reader';
import { resolveHtmlPath, stringifyMaxDepth } from './util';
import windowStateKeeper from 'electron-window-state';
import findFreePorts from 'find-free-ports';
import settings from './settings';
import { getExtensions } from './extension-utils';
import i18nInit from '../renderer/services/i18nInit';
import buildTrayIconMenu from './electron-tray-menu';
import buildDesktopMenu from './electron-menus';
import loadMainEvents from './mainEvents';
import { Extensions } from './types';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let isMacLike = process.platform === 'darwin';

let mainWindow: BrowserWindow | null = null;
/*let usedWsPort = undefined;

function getUsedWsPort() {
  return usedWsPort;
}*/

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const { exec } = require('child_process');

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')({ showDevTools: false });
}

const testMode = process.env.NODE_ENV === 'test';

let startupFilePath;
let portableMode;

process.argv.forEach((arg, count) => {
  console.log('Opening file: ' + arg);
  if (
    arg.toLowerCase() === '-d' ||
    arg.toLowerCase() === '--debug' ||
    arg.startsWith('--remote-debugging-port=') ||
    arg.startsWith('--inspect=')
  ) {
    // debugMode = true;
  } else if (arg.toLowerCase() === '-p' || arg.toLowerCase() === '--portable') {
    app.setPath('userData', process.cwd() + '/tsprofile'); // making the app portable
    portableMode = true;
  } else if (testMode || isDebug) {
    // ignoring the spectron testing
    arg = '';
  } else if (
    arg.endsWith('main.prod.js') ||
    arg === './app/main.dev.babel.js' ||
    arg === '.' ||
    count === 0
  ) {
    // ignoring the first argument
  } else if (arg.length > 2) {
    // console.warn('Opening file: ' + arg);
    if (arg !== './app/main.dev.js' && arg !== './app/') {
      startupFilePath = arg;
    }
  }

  if (portableMode) {
    startupFilePath = undefined;
  }
});

// if (isDebug) {
//   app.commandLine.appendSwitch('--allow-file-access-from-files');
// }

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

function showApp() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
  }
}

function findFirefoxPath() {
  const programFilesPath = process.env.ProgramFiles;
  const programFilesX86Path = process.env['ProgramFiles(x86)'];

  const firefoxPath1 = path.join(programFilesPath, 'Mozilla Firefox', 'firefox.exe');
  const firefoxPath2 = path.join(programFilesX86Path, 'Mozilla Firefox', 'firefox.exe');

  if (fs.existsSync(firefoxPath1)) {
    return firefoxPath1;
  } else if (fs.existsSync(firefoxPath2)) {
    return firefoxPath2;
  } else {
    throw new Error('Firefox installation not found.');
  }

}

function openLocationManagerPanel() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'open-location-manager-panel');
  }
}
function openTagLibraryPanel() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'open-tag-library-panel');
  }
}
function goBack() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'go-back');
  }
}
function goForward() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'go-forward');
  }
}
function setZoomResetApp() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'set-zoom-reset-app');
  }
}
function setZoomInApp() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'set-zoom-in-app');
  }
}
function setZoomOutApp() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'set-zoom-out-app');
  }
}
function exitFullscreen() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'exit-fullscreen');
  }
}
function toggleSettingsDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-settings-dialog');
  }
}
function openHelpFeedbackPanel() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'open-help-feedback-panel');
  }
}
function toggleKeysDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-keys-dialog');
  }
}
function toggleOnboardingDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-onboarding-dialog');
  }
}
function openURLExternally(data) {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('open-url-externally', data);
  }
}
function toggleLicenseDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-license-dialog');
  }
}
function toggleThirdPartyLibsDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-third-party-libs-dialog');
  }
}
function toggleAboutDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-about-dialog');
  }
}
function showSearch() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'open-search');
  }
}

function newTextFile() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'new-text-file');
  }
}

function getNextFile() {
  if (mainWindow) {
    mainWindow.webContents.send('cmd', 'next-file');
  }
}

function getPreviousFile() {
  if (mainWindow) {
    mainWindow.webContents.send('cmd', 'previous-file');
  }
}

function showCreateDirectoryDialog() {
  if (mainWindow) {
    mainWindow.webContents.send('cmd', 'show-create-directory-dialog');
  }
}

function toggleOpenLinkDialog() {
  if (mainWindow) {
    showApp();
    mainWindow.webContents.send('cmd', 'toggle-open-link-dialog');
  }
}

function resumePlayback() {
  if (mainWindow) {
    mainWindow.webContents.send('play-pause', true);
  }
}

function reloadApp() {
  if (mainWindow) {
    showApp();
    mainWindow.loadURL(resolveHtmlPath('index.html'));
  }
}

function createNewWindowInstance(url?) {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(appI18N);
    return;
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  const mainWindowInstance = new BrowserWindow({
    show: true,
    center: true,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      spellcheck: true,
      // webviewTag: true,
      preload:
        app.isPackaged || !isDebug
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindowInstance.setMenuBarVisibility(false);
  mainWindowInstance.setAutoHideMenuBar(true);
  if (url) {
    mainWindowInstance.loadURL(url);
  } else {
    mainWindowInstance.loadURL(resolveHtmlPath('index.html'));
  }
}

function buildTrayMenu(i18n) {
  buildTrayIconMenu(
    {
      showTagSpaces: showApp,
      resumePlayback,
      createNewWindowInstance,
      openSearch: showSearch,
      toggleNewFileDialog: newTextFile,
      openNextFile: getNextFile,
      openPrevFile: getPreviousFile,
      quitApp: reloadApp,
    },
    i18n,
    isMacLike,
  );
}

function buildAppMenu(i18n) {
  buildDesktopMenu(
    {
      showTagSpaces: showApp,
      openSearch: showSearch,
      toggleNewFileDialog: newTextFile,
      openNextFile: getNextFile,
      openPrevFile: getPreviousFile,
      quitApp: reloadApp,
      showCreateDirectoryDialog,
      toggleOpenLinkDialog,
      openLocationManagerPanel,
      openTagLibraryPanel,
      goBack,
      goForward,
      setZoomResetApp,
      setZoomInApp,
      setZoomOutApp,
      exitFullscreen,
      toggleSettingsDialog,
      openHelpFeedbackPanel,
      toggleKeysDialog,
      toggleOnboardingDialog,
      openURLExternally,
      toggleLicenseDialog,
      toggleThirdPartyLibsDialog,
      toggleAboutDialog,
      createNewWindowInstance,
    },
    i18n,
  );
}

/*const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};*/

function startWS(port = undefined) {
  try {
    let filepath;
    let script;
    let envPath;
    if (app.isPackaged) {
      filepath = process.resourcesPath; // path.join(__dirname, '../../..');
      script = 'app.asar/node_modules/@tagspaces/tagspaces-ws/build/index.js'; //app.asar/
      envPath = path.join(filepath, 'app.asar/.env');
    } else {
      filepath = path.join(
        __dirname,
        '../node_modules/@tagspaces/tagspaces-ws/build',
      );
      script = 'index.js';
      envPath = path.join(__dirname, '../.env');
    }
    const properties = propertiesReader(envPath); //getAssetPath('.env')
    //console.debug(JSON.stringify(properties.get('KEY')));

    const results = new Promise((resolve, reject) => {
      findFreePorts(1, { startPort: settings.getInitWsPort() }).then(
        ([findPort]) => {
          const freePort = port ? port : findPort;
          try {
            pm2.start(
              {
                name: 'Tagspaces WS',
                script, // Script to be run
                cwd: filepath, // './node_modules/tagspaces-ws', // './process1', cwd: '/path/to/npm/module/',
                args: ['-p', freePort, '-k', properties.get('KEY')],
                restartAt: [],
                // log: path.join(process.cwd(), 'thumbGen.log')
              },
              (err, pid) => {
                if (err && pid) {
                  if (pid && pid.name) console.error(pid.name, err, pid);
                  else console.error(err, pid);
                  reject(err);
                } else if (err) {
                  reject(err);
                } else {
                  settings.setUsedWsPort(freePort);
                  // usedWsPort = freePort;
                  if (mainWindow) {
                    mainWindow.webContents.send('start_ws', {
                      port: freePort,
                    });
                    console.debug('start_ws:' + freePort);
                  }
                  resolve(
                    `Starting ${pid.name} on ${pid.cwd} - pid (${pid.child.pid})`,
                  );
                }
              },
            );
          } catch (e) {
            console.error('pm2.start err:', e);
            reject(e);
          }
        },
      );
    });
    results
      .then((results) => console.debug(results))
      .catch((err) => console.error('pm2.start err:', err));
  } catch (ex) {
    console.error('pm2.start Exception __dirname:' + __dirname, ex);
  }
}

const createWindow = async (i18n) => {
  let startupParameter = '';
  if (startupFilePath) {
    if (startupFilePath.startsWith('./') || startupFilePath.startsWith('.\\')) {
      startupParameter =
        '?cmdopen=' + encodeURIComponent(path.join(__dirname, startupFilePath));
    } else if (startupFilePath !== 'data:,') {
      startupParameter = '?cmdopen=' + encodeURIComponent(startupFilePath);
    }
  }

  if (isDebug) {
    await installExtensions();
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    //icon: getAssetPath('icon.png'),
    webPreferences: {
      //nodeIntegrationInSubFrames: true,
      //webSecurity: app.isPackaged, // todo https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity
      spellcheck: true,
      //nodeIntegration: true,
      //webviewTag: true,
      //contextIsolation: false,
      preload:
        app.isPackaged || !isDebug
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  const winUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';
  const testWinOnUnix = false; // set to true to simulate windows os, useful for testing s3 handling

  mainWindow.loadURL(
    resolveHtmlPath('index.html') + startupParameter,
    testWinOnUnix ? { userAgent: winUserAgent } : {},
  );
  /*.then(() => {
      mainWindow.webContents.send('start_ws', {
        port: getUsedWsPort(),
      });
    });*/

  mainWindow.webContents.on('before-input-event', (_, input) => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (input.type === 'keyDown' && input.key === 'F12') {
      mainWindow.webContents.isDevToolsOpened()
        ? mainWindow.webContents.closeDevTools()
        : mainWindow.webContents.openDevTools({ mode: 'right' });
    }
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    //console.log('prosess:' + stringifyMaxDepth(process, 3));
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    // if (isMacLike) {
    //   mainWindow.webContents.setZoomFactor(0.9);
    // }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on(
    'render-process-gone',
    (_, { reason, exitCode }) => {
      /*console.error(
        `[web ui] render-process-gone: ${reason}, code: ${exitCode}`
      );*/
      // 'crashed'
      pm2.stopAll();
      globalShortcut.unregisterAll();
      app.quit();
    },
  );

  try {
    buildAppMenu(i18n);
    buildTrayMenu(i18n);
  } catch (ex) {
    console.log('buildMenus', ex);
  }

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // Fix broken autoplay functionality in the av player

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the macOS convention of having the application in memory even
  // after all windows have been closed
  if (!isMacLike) {
    // pm2.stopAll();
    // globalShortcut.unregisterAll();
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(appI18N);
  }
});

app.on('quit', () => {
  pm2.stopAll();
  globalShortcut.unregisterAll();
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

startWS(isDebug ? 2000 : undefined);

let appI18N;

app
  .whenReady()
  .then(() => {
    return i18nInit().then((i18n) => {
      appI18N = i18n;
      createWindow(i18n);
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow(i18n);
      });

      i18n.on('languageChanged', (lng) => {
        try {
          console.log('languageChanged:' + lng);
          buildAppMenu(i18n);
          buildTrayMenu(i18n);
        } catch (ex) {
          console.log('languageChanged', ex);
        }
      });

      ipcMain.on('show-main-window', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
        }
      });

      ipcMain.on('open-files-in-firefox', (event, selectedEntries) => {
        let firefoxPath = findFirefoxPath();
        selectedEntries.forEach(entry => {
          exec(`"${firefoxPath}" -P Blue "${entry.path}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error opening file ${entry.path} in Firefox: `, error.message);
            }
          });
        });
      });

      ipcMain.on('create-new-window', (e, url) => {
        createNewWindowInstance(url);
      });

      loadMainEvents();

      ipcMain.on('load-extensions', () => {
        getExtensions(path.join(app.getPath('userData'), 'tsplugins'), true)
          .then(({ extensions, supportedFileTypes }) => {
            if (mainWindow) {
              const setExtensions: Extensions = {
                extensions,
                supportedFileTypes,
              };
              mainWindow.webContents.send('set_extensions', setExtensions);
              // mainWindow.webContents.send('set_supported_file_types', supportedFileTypes);
            }
          })
          .catch((err) => console.error('load-extensions', err));
      });

      ipcMain.on('focus-window', () => {
        if (mainWindow) {
          mainWindow.focus();
        }
      });

      ipcMain.on('get-user-home-path', (event) => {
        event.returnValue = app.getPath('home');
      });

      ipcMain.on('worker-response', (event, arg) => {
        if (mainWindow) {
          mainWindow.webContents.send(arg.id, arg);
        }
      });

      ipcMain.on('app-data-path-request', (event) => {
        event.returnValue = app.getPath('appData'); // eslint-disable-line
      });

      ipcMain.on('app-version-request', (event) => {
        event.returnValue = app.getVersion(); // eslint-disable-line
      });

      ipcMain.on('set-language', (e, language) => {
        i18n.changeLanguage(language);
      });

      ipcMain.on('setZoomFactor', (event, zoomLevel) => {
        if (!mainWindow) {
          throw new Error('"mainWindow" is not defined');
        }
        mainWindow.webContents.setZoomFactor(zoomLevel);
      });

      ipcMain.on('global-shortcuts-enabled', (e, globalShortcutsEnabled) => {
        if (globalShortcutsEnabled) {
          globalShortcut.register('CommandOrControl+Shift+F', showSearch);
          globalShortcut.register('CommandOrControl+Shift+P', resumePlayback);
          globalShortcut.register('MediaPlayPause', resumePlayback);
          globalShortcut.register('CommandOrControl+Shift+N', newTextFile);
          globalShortcut.register('CommandOrControl+Shift+D', getNextFile);
          globalShortcut.register('MediaNextTrack', getNextFile);
          globalShortcut.register('CommandOrControl+Shift+A', getPreviousFile);
          globalShortcut.register('MediaPreviousTrack', getPreviousFile);
          globalShortcut.register('CommandOrControl+Shift+W', showApp);
        } else {
          globalShortcut.unregisterAll();
        }
      });

      ipcMain.on('relaunch-app', reloadApp);

      process.on('uncaughtException', (error) => {
        if (error.stack) {
          console.error('error:', error.stack);
          throw new Error(error.stack);
        }
        reloadApp();
      });
    });
  })
  .catch(console.log);
