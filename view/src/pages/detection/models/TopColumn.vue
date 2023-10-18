<template>
  <div class="q-pa-md q-gutter-sm bg-white q-electron-drag">
    <q-breadcrumbs>
      <q-breadcrumbs-el
        label="应用列表"
        icon="widgets"
        @click="showPreventDialog"
        style="-webkit-app-region: no-drag; cursor: pointer"
      />
      <q-breadcrumbs-el
        v-if="type == 'mark'"
        label="打标列表"
        icon="album"
        style="-webkit-app-region: no-drag; cursor: pointer"
      />
    </q-breadcrumbs>
  </div>
  <div>
    <q-banner inline-actions rounded class="bg-white text-black">
      <template v-slot:avatar>
        <img :src="icon" style="width: 80px; height: 80px" />
      </template>
      {{ name }} ({{ packageName }} ) 应用平台：Android 应用版本：{{ version
      }}<br />
      检测时间：{{ moment(createTime).format("YYYY-MM-DD HH:mm:ss") }}
      <template v-slot:action>
        <q-btn
          flat
          :label="refresh ? '停止刷新' : '数据刷新'"
          @click="changeRefresh"
          :icon="refresh ? 'stop_circle' : 'loop'"
        />
        <q-btn flat color="red" label="停止检测" @click="stopCheck" />
      </template>
    </q-banner>
  </div>
</template>
<script>
import { ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import socketio from "@utils/socketio";
import moment from "moment";
import { getRecord } from "src/indexed_db/records";

import { useAppInfoStore } from "stores/app-info";

function createWindow() {
  const routeData = this.$router.resolve({ path: "major" });
  window.open(routeData.href, "_blank").focus();
}
export default defineComponent({
  name: "TopColumn",
  components: {},
  emits: ["refresh"],
  props: {
    type: String,
  },
  async setup(_, { emit }) {
    const $q = useQuasar();
    const router = useRouter();
    const appInfoStore = useAppInfoStore();
    let name = "";
    let icon = "";
    let packageName = "";
    let version = "";
    let createTime = "";
    let recordId = router.currentRoute.value.query.recordsID;
    if (recordId) {
      var record = await getRecord(recordId);
      name = record.appName;
      icon = record.icon;
      packageName = record.appPackage;
      version = record.version;
      createTime = record.createTime;
    } else {
      name = $q.localStorage.getItem("appInfo-name");
      icon = $q.localStorage.getItem("appInfo-icon");
      packageName = $q.localStorage.getItem("appInfo-packageName");
      version = $q.localStorage.getItem("appInfo-version");
      createTime = $q.localStorage.getItem("appInfo-createTime");
    }

    function showPreventDialog() {
      $q.dialog({
        title: "提示",
        message: "在打标检测中无法回应用列表哦（停止检测即返回）",
        ok: "确定",
      });
    }

    let refresh = ref(true);
    return {
      createWindow,
      moment,
      name,
      icon,
      packageName,
      version,
      createTime,
      refresh,
      stopCheck() {
        let packageName = $q.localStorage.getItem("appInfo-packageName");
        socketio.send("hook_manager", {
          type: "stop",
          app: packageName,
          sleep: 0,
        });

        $q.notify({
          position: "center",
          progress: true,
          color: "green",
          message: name + " 停止检测成功！",
          actions: [{ icon: "close", color: "white" }],
        });
        //清除部分localStorage
        $q.localStorage.set("mark-step", 0);
        appInfoStore.clearAppInfo();
        $q.localStorage.set("appInfo-checkId", "");
        $q.localStorage.set("appInfo-checkPackageName", "");
        router.push({ path: "/" });
      },
      changeRefresh() {
        emit("refresh");
        refresh.value = !refresh.value;
      },
      showPreventDialog,
    };
  },
});
</script>

<style lang="sass">
.custom-table-sticky
  .q-table__middle
    max-height: calc(100vh - 70px)

    .q-table__top,
    .q-table__bottom,
    thead tr:first-child th
      background-color: #fff

    thead tr:first-child th
      top: 0

    thead tr th
      position: sticky
      z-index: 1
</style>
