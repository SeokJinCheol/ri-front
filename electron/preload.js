const { contextBridge, ipcRenderer } = require('electron');

const argument = process.argv.find((item) => item.startsWith('--real-iron-api-url='));
contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  backendUrl: argument ? decodeURIComponent(argument.slice('--real-iron-api-url='.length)) : undefined,
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
});
