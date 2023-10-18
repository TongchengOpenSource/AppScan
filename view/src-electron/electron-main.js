import { app, BrowserWindow, nativeTheme, ipcMain, shell } from "electron";
import path from "path";
import os from "os";
import { getFridaHelpProcess, fridaHelpWatch } from "./frida-helper";
import { updateHandle } from "./electron-update"; //引入
import { uploadErrorLogWatch } from "./electron-utils"; //引入

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

let mainWindow;
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 5,
      y: 10,
    },
    titleBarOverlay: true,
    frame: true,
    webPreferences: {
      sandbox: false,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);
  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // TODO we're on production; no access to devtools pls
    // mainWindow.webContents.on("devtools-opened", () => {
    //   mainWindow.webContents.closeDevTools();
    // });
  }

  if (platform === "win32") {
    updateHandle(mainWindow, "windows");
  } else {
    updateHandle(mainWindow, "mac");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  fridaHelpWatch(mainWindow);
  uploadErrorLogWatch(mainWindow);

  // 实现功能：若有正在打标提示用户是否关闭
  mainWindow.on("close", (e) => {
    //阻止默认行为，一定要有
    e.preventDefault();
    // 发送消息到渲染进程中，确定是否有正在打标的
    mainWindow.webContents.send("clickClose");
    ipcMain.on("judgeIsMark", (event, isChecking) => {
      if (isChecking) {
        app.exit(); //exit()直接关闭客户端，不会执行quit();
      }
    });
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("ready", () => {});

//打开url
ipcMain.on("open-url", (event, url) => {
  shell.openExternal(url);
});

app.on("quit", (e) => {
  // e.preventDefault();
  let fridaHelpProcess = getFridaHelpProcess();
  if (fridaHelpProcess) {
    fridaHelpProcess.kill("SIGKILL");
  }
});
