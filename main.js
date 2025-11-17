'use strict';

// Import parts of Electron to use
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// A simple check to see if the app is running in development mode.
const isDev = !app.isPackaged;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // It is important to preload a script to create a secure bridge
      // between the main process and the renderer process.
      preload: path.join(__dirname, 'preload.js'),
      // The sandbox is a security feature that isolates the renderer process.
      // It is highly recommended to keep it enabled.
      sandbox: true,
      // For security reasons, nodeIntegration and contextIsolation should be
      // configured carefully. The defaults (false and true respectively) are the most secure.
    },
    show: false, // Don't show the window until it's ready to avoid a white flash
    autoHideMenuBar: true,
    title: 'Gemini Web Browser',
    // 'hidden' gives a modern frameless look on macOS.
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1f1f20', // Corresponds to gemini-gray-800
      symbolColor: '#8ab4f8', // Corresponds to gemini-blue
      height: 40 // Height of the TabControls area
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open the DevTools automatically if in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Using app.whenReady() is the modern and recommended approach.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
