import { defineStore } from "pinia";
import { LocalStorage } from "quasar";

export const useAppInfoStore = defineStore("app-info", {
  state: () => ({
    name: "",
    icon: "",
    platform: "Android",
    version: "",
    createTime: "",
    packageName: "",
    id: "",
  }),
  getters: {},
  actions: {
    setAppInfo(id, name, icon, version, packName, createdAt) {
      this.id = id;
      this.name = name;
      this.icon = icon;
      this.platform = "Android";
      this.version = version;
      this.packageName = packName;
      if (createdAt) {
        this.createTime = createdAt;
        LocalStorage.set("appInfo-createTime", createdAt);
      }

      LocalStorage.set("appInfo-id", id);
      LocalStorage.set("appInfo-name", name);
      LocalStorage.set("appInfo-icon", icon);
      LocalStorage.set("appInfo-packageName", packName);
      LocalStorage.set("appInfo-version", version);
    },
    setAppId(id) {
      this.id = id;
      LocalStorage.set("appInfo-id", id);
    },
    clearAppInfo() {
      this.setAppInfo("", "", "", "", "", "");
    },
  },
});
