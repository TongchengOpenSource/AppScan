import { app, ipcMain, dialog } from "electron";
import path from "path";
const request = require("request");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");

const userDataPath = app.getPath("userData");
let fridaLogFile = path.join(userDataPath, "frida.log");
let helperLogFile = path.join(userDataPath, "helper.log");

// 设置事件，当提交错误时触发
function uploadErrorLogWatch(mainWindow) {
  ipcMain.handle(
    "uploadErrorLog",
    async (
      event,
      errorDescription,
      email,
      appscanVersions,
      androidVersions,
      phoneModel
    ) => {
      let body = await postErrorMessage(
        errorDescription,
        email,
        mainWindow,
        appscanVersions,
        androidVersions,
        phoneModel
      );
      return body;
    }
  );
}

// 生成md5 token
function createToken(timestamp) {
  const hash = crypto.createHash("md5");
  hash.update("BTtc6gdNYDBnM32RUeCJ5kLk" + timestamp);
  return hash.digest("hex");
}

// 发送用户报错信息
function postErrorMessage(
  errorDescription = "未正确发送",
  email = "error@ly.com",
  mainWindow,
  appscanVersions,
  androidVersions,
  phoneModel
) {
  // 生成秒级时间戳
  let timestamp = Math.floor(Date.now() / 1000);
  let helperFs = fs.createReadStream(helperLogFile);
  let fridaFs = fs.createReadStream(fridaLogFile);
  helperFs.setEncoding("utf8");
  fridaFs.setEncoding("utf8");

  const formData = {
    contact: email,
    explain: errorDescription,
    helperLog: helperFs,
    fridaLog: fridaFs,
    appscanVersions,
    androidVersions,
    phoneModel,
  };

  helperFs.on("close", (err) => {
    mainWindow.webContents.send("consolelog", err);
    helperFs.close();
  });
  fridaFs.on("close", (err) => {
    mainWindow.webContents.send("consolelog", err);
    fridaFs.close();
  });

  const headers = {
    token: createToken(timestamp),
    timestamp,
  };

  // 发送HTTP请求
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: "https://appscan.ly.com/report/push",
        formData: formData,
        headers: headers,
      },
      (err, res, body) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        fs.writeFileSync(helperLogFile, "");
        fs.writeFileSync(fridaLogFile, "");
        // 返回成功结果
        return resolve(body);
      }
    );
  });
}

export { uploadErrorLogWatch };
