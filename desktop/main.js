const { app, BrowserWindow, protocol, shell, ipcMain, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { fork } = require('child_process');
const crypto = require('crypto');
const Store = require('electron-store');

const isDev = !app.isPackaged;

// Lazy-init store with encryption (app.getPath not available until ready)
let _store;
function getStore() {
  if (!_store) {
    const encryptionKey = crypto
      .createHash('sha256')
      .update(`agentlead-${app.getPath('userData')}`)
      .digest('hex')
      .slice(0, 32);
    _store = new Store({ encryptionKey });
  }
  return _store;
}

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3099;

// ── Custom protocol for OAuth redirects ──
const PROTOCOL = 'agentlead';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// ── Single instance lock ──
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const deepLink = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLink) handleDeepLink(deepLink);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Deep link handler (OAuth callback) ──
function handleDeepLink(url) {
  // url = agentlead://auth/callback#access_token=...&refresh_token=...
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('auth-callback', url);
  }
}

// macOS deep link
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// ── Start the embedded Express backend ──
function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend', 'server.js')
    : path.join(process.resourcesPath, 'backend', 'server.js');

  const backendDir = isDev
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'backend');

  backendProcess = fork(backendPath, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON: '1',
      SUPABASE_URL: getStore().get('supabaseUrl') || process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: getStore().get('supabaseAnonKey') || process.env.SUPABASE_ANON_KEY || '',
    },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.on('error', (err) => {
    console.error('[backend] Process error:', err);
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(check);
      reject(new Error('Backend failed to start within 15s'));
    }, 15000);

    const check = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:${BACKEND_PORT}/health`);
        if (res.ok) {
          clearInterval(check);
          clearTimeout(timeout);
          console.log(`[backend] Ready on port ${BACKEND_PORT}`);
          resolve();
        }
      } catch {
        // Not ready yet
      }
    }, 300);
  });
}

// ── Create the main window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#050505',
    show: false,
  });

  // Show splash while loading
  mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Navigation guards — prevent renderer from navigating to untrusted URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url);
      if (isDev && parsed.hostname === 'localhost') return;
      if (parsed.protocol === 'file:') return;
      event.preventDefault();
      if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url);
      }
    } catch {}
    return { action: 'deny' };
  });

  return mainWindow;
}

// ── Load the React app ──
async function loadApp() {
  const url = isDev
    ? 'http://localhost:3005'
    : `file://${path.join(__dirname, 'renderer', 'dist', 'index.html')}`;

  await mainWindow.loadURL(url);
}

// ── IPC handlers ──
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('check-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
ipcMain.handle('open-external', (_event, url) => {
  try {
    const parsed = new URL(url);
    if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
      shell.openExternal(url);
    }
  } catch {}
});

// ── Auto-update events ──
autoUpdater.on('update-available', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded');
  }
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// ── App lifecycle ──
app.whenReady().then(async () => {
  createWindow();

  try {
    await startBackend();
    await loadApp();

    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  } catch (err) {
    console.error('Failed to start:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `document.getElementById('status').textContent = 'Failed to start backend. Please restart the app.';`
      );
    }
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
