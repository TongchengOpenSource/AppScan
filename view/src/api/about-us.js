import { api } from "boot/axios";
const config = require("../../package.json");

function getVersion() {
  return config.version;
}

function getHistory() {
  return api.get("https://appscan.ly.com/version").then((res) => {
    return res.data;
  });
}

export { getVersion, getHistory };
