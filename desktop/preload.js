const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  onAuthCallback: (callback) =>
    ipcRenderer.on('auth-callback', (_event, url) => callback(url)),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-updates'),
  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', () => callback()),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  installUpdate: () => ipcRenderer.send('install-update'),

  // Platform
  platform: process.platform,
  isElectron: true,
});
