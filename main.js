const { app, BrowserWindow } = require('electron')
const fs = require('fs')

// Mantém a referência global do objeto da janela.
// se você não fizer isso,
// a janela será fechada automaticamente
// quando o objeto JavaScript for coletado como lixo.
let mainWindow

function createWindow() {
    // Criar uma janela de navegação.
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
    mainWindow.once('ready-to-show', function () {
        mainWindow.show()
    })

    // Check debug
    const argv = process.argv.join()
    const isDebug = argv.includes('inspect') || argv.includes('debug')
    if (isDebug) {
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.removeMenu()
    }

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Emitido quando a janela é fechada.
    mainWindow.on('closed', () => {
        // Elimina a referência do objeto da janela, geralmente você iria armazenar as janelas
        // em um array, se seu app suporta várias janelas, este é o momento
        // quando você deve excluir o elemento correspondente.
        mainWindow = null
    })
}

// Este método será chamado quando o Electron tiver finalizado
// a inicialização e está pronto para criar a janela browser.
// Algumas APIs podem ser usadas somente depois que este evento ocorre.
app.on('ready', createWindow)

// Finaliza quando todas as janelas estiverem fechadas.
app.on('window-all-closed', () => {
    // No macOS é comum para aplicativos e sua barra de menu 
    // permaneçam ativo até que o usuário explicitamente encerre com Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// Neste arquivo, você pode incluir o resto do seu aplicativo especifico do processo
// principal. Você também pode colocar eles em arquivos separados e requeridos-as aqui.
