import { api } from "boot/axios";

function getAppList() {
  return api.get("/frida/app");
}

function adbInit() {
  return api.post("/adb/init");
}

function checkPhone() {
  return api.get("/adb/init/verify");
}
export { getAppList, adbInit, checkPhone };
