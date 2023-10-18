import { ipcMain, dialog, app } from "electron";
import { spawn } from "child_process";
import portfinder from "portfinder";
import { access, statSync, renameSync, writeFileSync, readFile } from "fs";
import path from "path";
// 处理log日志
import log4js from 'log4js';

let fridaHelpProcess;

var fridaPath = "";

// 获取程序的地址
const userDataPath = app.getPath('userData');
let fridalogfile = path.join(userDataPath, 'frida.log');
let helperlogfile = path.join(userDataPath, 'helper.log');
let helperbackupslogfile = path.join(userDataPath, 'helperbackups.log');

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: helperlogfile,
      maxLogSize: 5 * 1024 * 1024,
      backups: 0, // 当该文件大小超过maxLogSize会生成的备份数
      compress: false,
      keepFileExt: true,
    },
    backupFile: {
      type: 'file',
      filename: helperbackupslogfile,
    },
  },
  categories: {
    default: {
      appenders: ['file'],
      level: 'info',
    },
    backupFileLogger: {
      appenders: ['backupFile'],
      level: 'info',
    },
  },
});

const logger = log4js.getLogger();
const backupFileLogger = log4js.getLogger('backupFileLogger');

// 当长度超过5M，存储到备份文件中
function log (logMessage) {
  logger.info(logMessage);
  const fileStats = statSync(helperlogfile);
  if (fileStats.size > 5 * 1024 * 1024) {
    renameSync(helperlogfile, helperbackupslogfile);
    backupFileLogger.info(logMessage);
    writeFileSync(helperlogfile, '');
  }
}


function getAppRoot () {
  return path.join(app.getAppPath("exe"), "/../../");
}

let possiblePath = [
  "./frida-helper-mac/main",
  ".\\frida-helper\\main.exe",
  getAppRoot() + "/Resources/frida-helper/main",
  getAppRoot() + "resources\\frida-helper\\main.exe",
  getAppRoot() + "/Resources/frida-helper-mac/main",
  getAppRoot() + "resources\\frida-helper-mac\\main.exe",
];

for (let index = 0; index < possiblePath.length; index++) {
  const element = possiblePath[index];
  access(element, (err) => {
    if (err) {
    } else {
      fridaPath = element;
      return;
    }
  });
}

function fridaHelpWatch (mainWindow) {
  ipcMain.handle("start:frida-helper", async (e, data) => {
    const port = await portfinder.getPortPromise({
      port: 50000,
      stopPort: 60000,
    });

    fridaHelpProcess = spawn(fridaPath, ["-p", port, "-f", fridalogfile]);
    // TODO 测试本地
    try {
      await new Promise((resolve, reject) =>
        fridaHelpProcess.stderr.on("data", (data) => {
          log(data.toString()); // 调用log日志存储函数
          if (`${data}`.indexOf("Uvicorn running on") > 0) {
            resolve();
          }

          if (`${data}`.indexOf("ERROR") > 0) {
            reject(data);
          }
        })
      );
      // 如果没报错，说明走到了resolve，则启动成功
      return { success: true, port: port, message: "ok" };
    } catch (err) {
      // await 捕获reject结果
      dialog.showErrorBox("frida助手启动失败", err.toString("utf8"));
      app.quit();
      // 启动不成功
    }
  });
}

function getFridaHelpProcess () {
  return fridaHelpProcess;
}

export { getFridaHelpProcess, fridaHelpWatch };
