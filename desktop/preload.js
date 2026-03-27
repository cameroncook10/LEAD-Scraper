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

  // Subscription cache (encrypted electron-store)
  getSubscriptionCache: () => ipcRenderer.invoke('get-subscription-cache'),
  setSubscriptionCache: (data) => ipcRenderer.invoke('set-subscription-cache', data),
  clearSubscriptionCache: () => ipcRenderer.invoke('clear-subscription-cache'),

  // Auth token persistence (encrypted electron-store)
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  setAuthToken: (tokenData) => ipcRenderer.invoke('set-auth-token', tokenData),
  clearAuthToken: () => ipcRenderer.invoke('clear-auth-token'),

  // Platform
  platform: process.platform,
  isElectron: true,
});
