const { app, BrowserWindow, Tray, Menu, MenuItem, ipcMain, globalShortcut, screen } = require('electron');
const Task = require("./task")
const path = require('path');
const Store = require("electron-store")
const store = new Store()

const ICON = path.join(__dirname, "icon.png")
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow
let tray

const DEFAULT_SIZE = {
  width: 1000,
  height: 1000
}

const createWindow = () => {
  const pos = store.get('window.pos') || getCenterPosition();
  const size = store.get('window.size') || [DEFAULT_SIZE.width, DEFAULT_SIZE.height]
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: size[0],
    height: size[1],
    x: pos[0],
    y: pos[1],
    frame: false,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

//左上のメニューバーを変更する
//appnameはpackage化するとちゃんと変わるらしい
const createLeftMenu = () => {
  const tm = new Menu()
  tm.append(new MenuItem({
    label: app.name,
    submenu: [
      new MenuItem({
        label: "quit",
        accelerator: "Cmd+Q",
        click: () => {
          quit()
        }
      }),
      new MenuItem({
        label: "hide",
        accelerator: "Cmd+W",
        click: () => { hide() }
      }),
    ]
  }))
  // メニューを適用する
  Menu.setApplicationMenu(tm);
}

//右上に表示されるIconを表示
const createTray = () => {
  tray = new Tray(ICON)
}

const show = () => {
  mainWindow.show()
  if(process.platform == "darwin" ) {
    app.dock.show()
  }
}
const hide = () => {
  //ここが動くのmacだけかも
  if (process.platform == "darwin") {
    app.hide()
    app.dock.hide()
    mainWindow.blur()
  }
}

const quit = () => {
  mainWindow.webContents.send("quit")
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createTray()
  createWindow()
  createLeftMenu()
  show()

  globalShortcut.register("Alt+T", () => {
    show()
  })
});

app.on('ready', () => {
  if(process.platform == "darwin"){
    app.dock.hide()
  }
})

//初期配列を取得
ipcMain.on("getInitialArray", (event) => {
  if (store.has("task")) {
    event.returnValue = store.get("task")
  } else {
    event.returnValue = []
  }
  return
})

//保存して終了
ipcMain.on("saveThenQuit", (event, taskArray) => {
  store.set("task", taskArray)//taskArrayの状態
  store.set('window.pos', mainWindow.getPosition())  // ウィンドウの座標を記録
  store.set('window.size', mainWindow.getSize())     // ウィンドウのサイズを記録
  app.quit()
})

function getCenterPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const x = Math.floor((width - DEFAULT_SIZE.width) / 2)
  const y = Math.floor((height - DEFAULT_SIZE.height) / 2)
  return ([x, y]);
}