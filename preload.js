// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// We can use this script to selectively expose Node.js APIs to the renderer process
// via the contextBridge API, which is more secure than enabling nodeIntegration.

// const { contextBridge, ipcRenderer } = require('electron');

// Example of exposing a function to the renderer process:
// contextBridge.exposeInMainWorld('electronAPI', {
//   onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value))
// });
