/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("systemApi", {
  async startFridaHelp() {
    let result = await ipcRenderer.invoke("start:frida-helper");
    return result;
  },
  async watchLog() {
    ipcRenderer.on("consolelog", function (event, data) {
      // console.log("log=>", data)
    });
  },
  async checkVersion(bySelf) {
    return await ipcRenderer.send("checkForUpdate", bySelf);
  },
  //打开文档
  openDocs: () => ipcRenderer.send("open-url", "https://github.com/TongchengOpenSource/AppScan/wiki"),
  //打开issues
  openIssues: () =>
    ipcRenderer.send(
      "open-url",
      "https://github.com/tongcheng-security-team/AppScan/issues"
    ),
  //监听更新进度
  listenUpdate: (callback) => ipcRenderer.on("downloadProgress", callback),
  //判断是否需要更新
  listenCheckUpdate: (callback) => ipcRenderer.on("needUpdate", callback),
  //监听是否打开更新窗口
  listenChangeUpdateModal: (callback) =>
    ipcRenderer.on("changeUpdateModal", callback),
  //暂不安装后,重新回复状态
  listenResetUpdate: (callback) => ipcRenderer.on("resetUpdate", callback),
  // 发送错误日志给服务器
  uploadErrorLog(
    errorDescription,
    email,
    appscanVersions,
    androidVersions,
    phoneModel
  ) {
    return ipcRenderer.invoke(
      "uploadErrorLog",
      errorDescription,
      email,
      appscanVersions,
      androidVersions,
      phoneModel
    );
  },
  // 点击应用关闭按钮
  clickClose(callback) {
    ipcRenderer.on("clickClose", callback);
  },
  // 判断是否有应用在打标中
  judgeIsMark(isMarking) {
    ipcRenderer.send("judgeIsMark", isMarking);
  },
});
