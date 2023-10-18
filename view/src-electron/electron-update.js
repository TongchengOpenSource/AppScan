import { dialog, ipcMain } from "electron";
const { autoUpdater } = require("electron-updater");
const config = require("./../package.json");
const log = require("electron-log");
let notNeedDialog = false;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
const isDevelopment = process.env.NODE_ENV !== "production";
// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
export const updateHandle = (mainWindow, osName) => {
  let uploadUrl = "https://oss.17usoft.com/download/" + osName;

  if (isDevelopment && !process.env.IS_TEST) {
    // 调试环境
    autoUpdater.currentVersion = config.version;
  }
  autoUpdater.setFeedURL(uploadUrl);
  //在下载之前将autoUpdater的autoDownload属性设置成false，通过渲染进程触发主进程事件来实现这一设置
  autoUpdater.autoDownload = false;

  autoUpdater.on("download-progress", (progressObj) => {
    log.info("下载进度:", progressObj);
    mainWindow.webContents.send("downloadProgress", progressObj);
  });

  autoUpdater.on("update-available", (config) => {
    log.info("update-available:", config);
    mainWindow.webContents.send("needUpdate", config);
    dialog
      .showMessageBox({
        type: "info",
        title: "发现新版本 " + config.version,
        detail: config.label,
        defaultId: 0,
        noLink: true,
        message: "您有新的更新! " + config.version,
        buttons: ["立即更新", "暂不更新"],
      })
      .then((resp) => {
        if (resp.response == 0) {
          log.info("开始更新... ...");
          autoUpdater.downloadUpdate();
          mainWindow.webContents.send("changeUpdateModal", true);
        }
      });
  });
  autoUpdater.on("update-not-available", () => {
    if (notNeedDialog) {
      return;
    }
    dialog.showMessageBox({
      type: "info",
      title: "更新消息",
      detail: "已经是最新版本啦!",
    });
  });

  autoUpdater.on("update-downloaded", () => {
    //下载完成就关闭窗口
    mainWindow.webContents.send("changeUpdateModal", false);
    dialog
      .showMessageBox({
        title: "下载完成",
        message: "最新版本已下载完成, 退出程序进行安装",
        defaultId: 0,
        noLink: true,
        message: "最新版本已下载完成, 将退出程序进行安装!",
        buttons: ["立即安装", "暂不安装"],
      })
      .then((resp) => {
        if (resp.response == 0) {
          log.info("开始安装... ...");
          autoUpdater.quitAndInstall();
        } else {
          // //不安装则恢复状态
          // mainWindow.webContents.send("resetUpdate");
        }
      });
  });

  ipcMain.on("checkForUpdate", (event, bySelf) => {
    if (bySelf) {
      //如果是系统自测 不需要更新则不现实dialog
      notNeedDialog = true;
    } else {
      notNeedDialog = false;
    }
    // 收到renderer进程的检查通知后，开始检查更新
    autoUpdater.checkForUpdates();
  });
};
