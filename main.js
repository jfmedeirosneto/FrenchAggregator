const { app, BrowserWindow, webContents } = require('electron')
const fs = require('fs')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let mainWindow

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 800,
        center: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true
        }
    })
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    // Check debug
    const argv = process.argv.join()
    const isDebug = argv.includes('inspect') || argv.includes('debug')
    if (isDebug == false) {
        mainWindow.removeMenu()
    }

    // And load the index.html of the app
    mainWindow.loadFile('index.html')

    // Emitted when the window is going to be closed
    mainWindow.on('close', () => {
        // On close clear all data of app and web contents
        webContents.getAllWebContents().forEach(contents => {
            contents.clearHistory()
            contents.session.clearCache(() => { })
            contents.session.clearStorageData({
                storages: [
                    'appcache',
                    'filesystem',
                    'indexdb',
                    'localstorage',
                    'shadercache',
                    'websql',
                    'serviceworkers',
                    'cachestorage'
                ]
            }, () => { })
        })
    })

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows
// Some APIs can only be used after this event occurs
app.on('ready', createWindow)

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (mainWindow === null) {
        createWindow()
    }
})
