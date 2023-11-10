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
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import pm2 from '@elife/pm2';
import propertiesReader from 'properties-reader';
import fs from 'fs-extra';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import windowStateKeeper from 'electron-window-state';
import findFreePorts from 'find-free-ports';
import settings from '../renderer/settings';
import { getExtensions } from '../renderer/utils/extension-utils';
import i18nInit from '../renderer/services/i18nInit';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let usedWsPort = undefined;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
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

function showTagSpaces() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
  }
}

function openLocationManagerPanel() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'open-location-manager-panel');
  }
}
function openTagLibraryPanel() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'open-tag-library-panel');
  }
}
function goBack() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'go-back');
  }
}
function goForward() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'go-forward');
  }
}
function setZoomResetApp() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'set-zoom-reset-app');
  }
}
function setZoomInApp() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'set-zoom-in-app');
  }
}
function setZoomOutApp() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'set-zoom-out-app');
  }
}
function exitFullscreen() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'exit-fullscreen');
  }
}
function toggleSettingsDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-settings-dialog');
  }
}
function openHelpFeedbackPanel() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'open-help-feedback-panel');
  }
}
function toggleKeysDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-keys-dialog');
  }
}
function toggleOnboardingDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-onboarding-dialog');
  }
}
function openURLExternally(data) {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('open-url-externally', data);
  }
}
function toggleLicenseDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-license-dialog');
  }
}
function toggleThirdPartyLibsDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-third-party-libs-dialog');
  }
}
function toggleAboutDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-about-dialog');
  }
}
function showSearch() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'open-search');
  }
}

function newTextFile() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'new-text-file');
  }
}

function getNextFile() {
  if (mainWindow) {
    // showTagSpaces();
    mainWindow.webContents.send('cmd', 'next-file');
  }
}

function getPreviousFile() {
  if (mainWindow) {
    // showTagSpaces();
    mainWindow.webContents.send('cmd', 'previous-file');
  }
}

function showCreateDirectoryDialog() {
  if (mainWindow) {
    // showTagSpaces();
    mainWindow.webContents.send('cmd', 'show-create-directory-dialog');
  }
}

function toggleOpenLinkDialog() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.webContents.send('cmd', 'toggle-open-link-dialog');
  }
}

function resumePlayback() {
  if (mainWindow) {
    // showTagSpaces();
    mainWindow.webContents.send('play-pause', true);
  }
}

function reloadApp() {
  if (mainWindow) {
    showTagSpaces();
    mainWindow.loadURL(resolveHtmlPath('index.html'));
  }
}

function createNewWindowInstance(url?) {
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
      webSecurity: false, // todo https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity
      spellcheck: true,
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,
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

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

async function startWS() {
  try {
    let filepath;
    let script;
    //let envPath;
    if (isDebug || testMode) {
      filepath = path.join(
        __dirname,
        '../node_modules/@tagspaces/tagspaces-ws/build',
      );
      script = 'index.js';
      //envPath = path.join(__dirname, '.env');
    } else {
      filepath = process.resourcesPath;
      script = 'app.asar/node_modules/@tagspaces/tagspaces-ws/build/index.js';
      //envPath = path.join(process.resourcesPath, 'app.asar/.env');
    }
    const properties = propertiesReader(getAssetPath('.env')); //envPath);

    const results = await new Promise((resolve, reject) => {
      findFreePorts(1, { startPort: settings.getInitWsPort() }).then(
        ([freePort]) => {
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
                usedWsPort = freePort;
                if (mainWindow) {
                  mainWindow.webContents.send('start_ws', {
                    port: freePort,
                  });
                }
                resolve(
                  `Starting ${pid.name} on ${pid.cwd} - pid (${pid.child.pid})`,
                );
              }
            },
          );
        },
      );
    });
    console.debug(results);
  } catch (ex) {
    console.error('pm2.start Exception:', ex);
  }
}

const createWindow = async () => {
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
    icon: getAssetPath('icon.png'),
    webPreferences: {
      webSecurity: false, // todo https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity
      spellcheck: true,
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,
      preload: app.isPackaged
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

  mainWindow.webContents.send('start_ws', {
    port: usedWsPort,
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
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

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

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
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    pm2.stopAll();
    globalShortcut.unregisterAll();
    app.quit();
  }
});

app.on('quit', () => {
  pm2.stopAll();
  globalShortcut.unregisterAll();
});

startWS();

app
  .whenReady()
  .then(() => {
    return i18nInit().then((i18n) => {
      createWindow();
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow();
      });

      i18n.on('languageChanged', (lng) => {
        try {
          console.log('languageChanged:' + lng);
          //buildAppMenu(i18n);
          //buildTrayMenu(i18n);
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

      ipcMain.on('create-new-window', (e, url) => {
        createNewWindowInstance(url);
      });

      ipcMain.on('load-extensions', () => {
        getExtensions(path.join(app.getPath('userData'), 'tsplugins'), true)
          .then(({ extensions, supportedFileTypes }) => {
            if (mainWindow) {
              mainWindow.webContents.send('set_extensions', {
                extensions,
                supportedFileTypes,
              });
              // mainWindow.webContents.send('set_supported_file_types', supportedFileTypes);
            }
          })
          .catch((err) => console.error('load-extensions', err));
      });

      ipcMain.on('remove-extension', (e, extensionId) => {
        try {
          const extBuildIndex = extensionId.indexOf('/build');
          fs.rmSync(
            path.join(
              app.getPath('userData'),
              'tsplugins',
              extBuildIndex > -1
                ? extensionId.substring(0, extBuildIndex)
                : extensionId,
            ),
            {
              recursive: true,
            },
          );
        } catch (e) {
          console.debug(e);
        }
      });

      ipcMain.handle('get-user-data', () => {
        return app.getPath('userData');
      });

      ipcMain.on('focus-window', () => {
        if (mainWindow) {
          mainWindow.focus();
        }
      });

      ipcMain.handle('get-device-paths', () => {
        const paths: any = {
          desktopFolder: app.getPath('desktop'),
          documentsFolder: app.getPath('documents'),
          downloadsFolder: app.getPath('downloads'),
          musicFolder: app.getPath('music'),
          picturesFolder: app.getPath('pictures'),
          videosFolder: app.getPath('videos'),
        };
        if (process.platform === 'darwin') {
          paths.iCloudFolder =
            app.getPath('home') +
            '/Library/Mobile Documents/com~apple~CloudDocs';
        }
        return paths;
      });

      ipcMain.on('get-user-home-path', (event) => {
        event.returnValue = app.getPath('home');
      });

      ipcMain.on('worker-response', (event, arg) => {
        if (mainWindow) {
          mainWindow.webContents.send(arg.id, arg);
        }
      });

      ipcMain.handle('select-directory-dialog', async () => {
        const options = {
          properties: ['openDirectory', 'createDirectory'],
        };
        // @ts-ignore
        const resultObject = await dialog.showOpenDialog(options);

        if (resultObject.filePaths && resultObject.filePaths.length) {
          // alert(JSON.stringify(resultObject.filePaths));
          return resultObject.filePaths;
        }
        return false;
      });

      // end electron-io

      ipcMain.on('app-data-path-request', (event) => {
        event.returnValue = app.getPath('appData'); // eslint-disable-line
      });

      ipcMain.on('app-version-request', (event) => {
        event.returnValue = app.getVersion(); // eslint-disable-line
      });

      ipcMain.handle('move-to-trash', async (event, files) => {
        const result = [];
        files.forEach((fullPath) => {
          // console.debug('Trash:' + fullPath);
          result.push(shell.trashItem(fullPath));
        });

        let ret;
        try {
          ret = await Promise.all(result);
        } catch (err) {
          console.error('moveToTrash ' + JSON.stringify(files) + 'error:', err);
        }
        return ret;
      });

      /* ipcMain.on('move-to-trash', async (event, files) => {
        const result = [];
        files.forEach(fullPath => {
          console.debug('Trash:' + fullPath);
          result.push(shell.trashItem(fullPath));
        });
        try {
          event.returnValue = await Promise.all(result);
        } catch (err) {
          console.error('moveToTrash error:', err);
          event.returnValue = undefined;
        }
      }); */

      ipcMain.on('set-language', (e, language) => {
        i18n.changeLanguage(language);
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
          globalShortcut.register('CommandOrControl+Shift+W', showTagSpaces);
        } else {
          globalShortcut.unregisterAll();
        }
      });

      ipcMain.on('relaunch-app', reloadApp);

      ipcMain.on('quit-application', () => {
        globalShortcut.unregisterAll();
        app.quit();
      });

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
