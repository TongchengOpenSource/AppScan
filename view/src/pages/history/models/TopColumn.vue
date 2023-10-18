<template>
  <div class="q-pa-md q-gutter-sm bg-white q-electron-drag">
    <q-breadcrumbs>
      <q-breadcrumbs-el
        label="检测记录"
        icon="widgets"
        to="/record"
        style="-webkit-app-region: no-drag"
      />
      <q-breadcrumbs-el
        v-if="type == 'result' || type == 'major'"
        label="检测结果"
        icon="perm_device_information"
        :to="'/record/result?recordsID=' + recordId"
        style="-webkit-app-region: no-drag"
      />
      <q-breadcrumbs-el
        v-if="type == 'major'"
        label="专业模式"
        icon="album"
        :to="'/record/major?recordsID=' + recordId"
        style="-webkit-app-region: no-drag"
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
        <q-btn flat label="结果导出" @click="downLoad" />

        <q-btn
          v-if="type == 'major'"
          flat
          label="检测结果"
          @click="jumpToResult(recordId)"
        />
        <q-btn
          v-if="type == 'result'"
          flat
          label="专业模式"
          @click="jumpToMajor(recordId)"
        />
        <q-btn
          v-if="type == 'mark'"
          flat
          label="专业模式"
          @click="jumpToMajor(app.recordId)"
        ></q-btn>
      </template>
    </q-banner>
  </div>
</template>
<script>
import { defineComponent } from "vue";
import { useQuasar } from "quasar";
import { getRecord } from "src/indexed_db/records";
import { useRouter } from "vue-router";

import moment from "moment";
function jumpToResult(id) {
  this.$router.push("/record/result?recordsID=" + id);
}
function jumpToMajor(id) {
  this.$router.push("/record/major?recordsID=" + id);
}

function createWindow() {
  const routeData = this.$router.resolve({ path: "major" });
  window.open(routeData.href, "_blank").focus();
}

export default defineComponent({
  name: "TopColumn",
  components: {},
  emits: ["download"],
  props: {
    type: String,
    app: Object,
  },
  async setup(props, context) {
    const router = useRouter();
    const $q = useQuasar();
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
    return {
      jumpToResult,
      jumpToMajor,
      createWindow,
      name,
      icon,
      packageName,
      version,
      createTime,
      moment,
      recordId,
      downLoad() {
        context.emit("download", "");
      },
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
