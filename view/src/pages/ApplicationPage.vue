<template>
  <q-inner-loading
    :showing="data.loading"
    v-if="data.loading"
    label="努力加载中..."
    label-class="text-teal"
    label-style="font-size: 1.1em"
  />
  <q-page class="row" v-else>
    <q-card
      style="width: 100%; text-align: center"
      flat
      v-if="data.rows.length > 0 ? false : true"
    >
      <q-img
        src="~assets/connect.png"
        width="45%"
        height="70%"
        fit="contain"
        position="0 70px"
      >
      </q-img>
      <div class="absolute-bottom text-center" style="background: #fff">
        <div class="detail-box text-grey-6">
          <span class="text-subtitle2">无法连接的原因</span>
          <div class="detail-msg">
            <p>1. 安卓手机必须ROOT, 打开ADB调试</p>
            <p>2. 连接时必须允许软件申请ROOT并同意ADB调试</p>
            <p>3. 检测的APP未加壳才能正常运行</p>
          </div>
        </div>
        <q-btn
          flat
          color="teal"
          label="请点击这里连接到设备开始隐私合规检测"
          @click="connectPhone"
        />
      </div>
    </q-card>
    <q-table
      v-else
      class="fit custom-table-sticky"
      title="应用列表"
      hide-pagination
      flat
      :rows-per-page-options="[0]"
      :loading="data.loading"
      :rows="data.rows"
      :columns="columns"
      row-key="name"
      :filter="data.filter"
      :filter-method="searchApp"
    >
      <template #top>
        <div class="app-list-top-style q-electron-drag">
          <div class="q-table__title">应用列表</div>
          <q-input
            dense
            outlined
            click-enable
            autofocus
            debounce="1300"
            v-model="data.filter"
            placeholder="搜索"
            style="-webkit-app-region: no-drag"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <div style="width: 10%"></div>
        </div>
      </template>
      <template v-slot:no-data>
        <div class="full-width row flex-center q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span> 暂未发现您想找的应用 </span>
        </div>
      </template>
      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
      <template v-slot:body-cell-icon="props">
        <q-td :props="props">
          <q-avatar square size="40px">
            <img :src="props.row.icon" />
          </q-avatar>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            color="primary"
            @click="startCheck(props.row)"
            v-if="checkAppInfo.package != props.row.package"
            label="开始检测"
          />
          <q-btn
            flat
            color="primary"
            v-else
            @click="continueCheck()"
            label="继续检测"
          />
          <q-btn
            flat
            color="red"
            v-if="checkAppInfo.package == props.row.package"
            @click="stopCheck(props.row)"
            label="停止检测"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
  <!-- 错误信息提交弹窗 -->
  <errorSubmitDialog ref="errorSubmitDialogRef" />
</template>

<script>
import { defineComponent, reactive, ref } from "vue";
import { getAppList, adbInit, checkPhone } from "@api/api";
import { useQuasar, QSpinnerFacebook } from "quasar";
import socketio from "@utils/socketio";
import { startPrivacyCheck } from "src/indexed_db/records";
import { insertMethodResult } from "src/indexed_db/method";
import {
  insertRequestResult,
  upsertRequestResult,
} from "src/indexed_db/request";
import { sdk } from "../utils/sdk";
import { useAppInfoStore } from "stores/app-info";
import errorSubmitDialog from "../components/errorSubmitDialog.vue";

const columns = [
  {
    name: "icon",
    label: "LOGO",
    align: "center",
    field: "icon",
  },
  {
    name: "name",
    required: true,
    label: "应用名称",
    field: "name",
    align: "center",
  },
  {
    name: "package",
    required: true,
    label: "包名",
    field: "package",
    align: "center",
    // sortable: true
  },
  {
    name: "version",
    required: true,
    label: "应用版本",
    align: "center",
    field: "version",
    // sortable: true
  },
  {
    name: "actions",
    label: "操作",
    align: "center",
  },
];

var req_data = {};
export default defineComponent({
  name: "ApplicationPage",
  components: { errorSubmitDialog },
  setup() {
    const $q = useQuasar();
    let data = reactive({
      loading: false,
      rows: [],
      filter: "",
    });
    let checkAppInfo = reactive({ package: "", id: "" });
    let attemptCount = 0; // 保存尝试获取app列表的次数
    let initComplete = $q.localStorage.getItem("init-complete"); // 初始化是否完成
    let errorSubmitDialogRef = ref();
    checkAppInfo.package =
      $q.localStorage.getItem("appInfo-checkPackageName") || "";
    checkAppInfo.id = $q.localStorage.getItem("appInfo-checkId") || "";

    const appInfoStore = useAppInfoStore();

    // 用作初始化时以及重新渲染组件时获取app列表
    function getInitAppList() {
      // 初始化完成，
      if (!initComplete) return;
      data.loading = true; // 请求app列表时，显示loading图
      getAppList().then((res) => {
        if (res?.data?.code === 400 || res?.data?.detail?.length === 0) {
          if (attemptCount < 3) {
            attemptCount++;
            setTimeout(getInitAppList, 1000); // 等待1s后再次尝试获取
          } else {
            $q.loading.hide();
            data.loading = false; // 获取失败，显示连接图
            $q.notify({
              position: "top",
              color: "red",
              progress: true,
              actions: [{ icon: "close", color: "white" }],
              message: "获取手机应用列表失败,请尝试重启应用后重试！",
            });
            // 弹出错误提交弹窗
            errorSubmitDialogRef.value.errorSubmitDialog = true;
            errorSubmitDialogRef.value.errorInfo.errorDescription =
              res.data.description;
          }
        } else {
          data.rows = res.data.detail;
          $q.loading.hide(); // 隐藏loading
          data.loading = false; // 获取完app列表之后，不显示加载图
        }
      });
    }
    getInitAppList(); // 获取打标页面

    return {
      data,
      columns,
      appInfoStore,
      checkAppInfo,
      getInitAppList,
      errorSubmitDialogRef,
      async connectPhone() {
        $q.loading.show({
          spinner: QSpinnerFacebook,
          message: "正在为您检测手机状态是否存在问题...",
          messageColor: "white",
        });
        let checkResponse = await checkPhone();
        if (checkResponse.data.status != "OK") {
          $q.loading.hide();
          $q.notify({
            position: "center",
            progress: true,
            color: "red",
            message: checkResponse.data.description,
            actions: [{ icon: "close", color: "white" }],
          });
          return;
        }
        $q.loading.show({
          spinner: QSpinnerFacebook,
          message: "正在为您进行adb工具初始化...",
          messageColor: "white",
        });
        let initResponse = await adbInit();
        if (initResponse.data.code === 200) {
          initComplete = true;
          $q.localStorage.set("init-complete", true);
        } else {
          $q.loading.hide();
          $q.notify({
            position: "top",
            progress: true,
            color: "red",
            message: "手机初始化失败，错误描述如下所示",
            actions: [{ icon: "close", color: "white" }],
          });
          // 弹出错误提交弹窗
          errorSubmitDialogRef.value.errorSubmitDialog = true;
          errorSubmitDialogRef.value.errorInfo.errorDescription =
            initResponse.data.description;
          return;
        }
        getInitAppList(); // 获取打标页面
        $q.loading.show({
          spinner: QSpinnerFacebook,
          message: "获取手机应用列表中...",
          messageColor: "white",
        });
      },
      async startCheck(appInfo) {
        if (checkAppInfo.package != "") {
          $q.notify({
            position: "center",
            progress: true,
            message: "已有app在检测中，请不要重复检测！",
            actions: [{ icon: "close", color: "white" }],
          });
          return;
        }
        // 检测app的入库，拿到检测的
        let privacyId = await startPrivacyCheck(
          appInfo.name,
          appInfo.package,
          appInfo.version,
          appInfo.icon
        );
        appInfoStore.setAppInfo(
          privacyId,
          appInfo.name,
          appInfo.icon,
          appInfo.version,
          appInfo.package,
          new Date().getTime()
        );
        const sendBody = {
          type: "start",
          app: appInfo.package,
          sleep: $q.localStorage.getItem("setting-waitTime") || 0,
          script: "",
          mode: $q.localStorage.getItem("setting-engineSelect") || "default",
        };
        socketio.send("hook_manager", sendBody);
        checkAppInfo.package = appInfo.package;
        checkAppInfo.id = privacyId;
        $q.localStorage.set("appInfo-checkId", privacyId);
        $q.localStorage.set("appInfo-checkPackageName", appInfo.package);
        socketio.receive("hook_result", (data) => {
          if (data.success == false) {
            return;
          }
          if (data.result.type == "method_result") {
            // 添加新的数据
            var main = "main";
            for (let index = 0; index < sdk.length; index++) {
              const element = sdk[index];
              if (
                data.result.message.payload.stacks.indexOf(
                  element.package_name
                ) !== -1
              ) {
                // 是第三方 sdk
                main = element.package_name;
              }
            }
            if (
              data.result.message.payload.messages == '申请具体权限看"参数1"'
            ) {
              data.result.message.payload.messages = "申请权限";
            }
            if (
              data.result.message.payload.messages == "获取网络类型" ||
              data.result.message.payload.messages == "获取网络类型名称" ||
              data.result.message.payload.messages == "获取网络名称" ||
              data.result.message.payload.messages == "获取网络是否可用" ||
              data.result.message.payload.messages == "获取网络是否连接" ||
              (data.result.message.payload.messages ==
                "RandomAccessFile写文件" &&
                main == "main") ||
              (data.result.message.payload.messages ==
                "尝试写入sdcard创建小米市场审核可能不通过" &&
                main == "main") ||
              data.result.message.payload.messages.search(
                "getPackageInfoAsUser获取的数据为：PackageInfo"
              ) != -1 ||
              data.result.message.payload.messages.search(
                "getInstallerPackageName获取的数据为"
              ) != -1 ||
              data.result.message.payload.messages.search(
                "RandomAccessFile写文件"
              ) != -1 ||
              data.result.message.payload.stacks.search(
                "com.tongcheng.debug.plugin"
              ) != -1 ||
              data.result.message.payload.stacks.search(
                "com.elong.debug.plugin"
              ) != -1
            ) {
              return;
            }
            insertMethodResult(
              privacyId,
              main,
              data.result.message.payload.messages,
              data.result.message.payload.stacks
            );
          } else if (data.result.type == "request_result") {
            if (
              data.result.message.payload.messages["function"] == "SSL_write"
            ) {
              // HTTPS 发送
              var body = data.result.payload;
              var clear_body = body.split("..");
              var host = "";
              var method = "";
              var methods = [
                "GET",
                "POST",
                "UPDATE",
                "PUT",
                "PATCH",
                "DELETE",
                "COPY",
                "HEAD",
                "OPTIONS",
              ];
              for (let index = 0; index < methods.length; index++) {
                const element = methods[index];
                if (clear_body[0].indexOf(element) == 0) {
                  method = element;
                }
              }
              if (method == "") {
                return;
              }
              for (let index = 0; index < clear_body.length; index++) {
                const element = clear_body[index];
                if (element.indexOf("Host") == 0) {
                  host = element.split(": ")[1];
                }
              }
              insertRequestResult(
                privacyId,
                "SSL",
                host,
                method,
                body,
                data.result.message.payload.messages["ssl_session_id"],
                "",
                "wait"
              );
            } else if (
              data.result.message.payload.messages["function"] == "SSL_read"
            ) {
              // HTTPS 接受
              var body = data.result.payload;
              var clear_body = body.split("..");
              var code = 0;
              if (clear_body[0].indexOf("200") != -1) {
                code = 200;
              } else if (clear_body[0].indexOf("500") != -1) {
                code = 500;
              }
              upsertRequestResult(
                privacyId,
                "SSL",
                "ok",
                code,
                data.result.payload,
                data.result.message.payload.messages["ssl_session_id"],
                ""
              );
            } else if (
              data.result.message.payload.messages["function"] == "HTTP_send"
            ) {
              if (data.result.message.payload.messages["dst_port"] != 443) {
                // HTTP 发送
                var body = data.result.payload;
                var clear_body = body.split("..");
                var host = "";
                var method = "";
                var methods = [
                  "GET",
                  "POST",
                  "UPDATE",
                  "PUT",
                  "PATCH",
                  "DELETE",
                  "COPY",
                  "HEAD",
                  "OPTIONS",
                ];
                for (let index = 0; index < methods.length; index++) {
                  const element = methods[index];
                  if (clear_body[0].indexOf(element) == 0) {
                    method = element;
                  }
                }
                if (method == "") {
                  return;
                }
                for (let index = 0; index < clear_body.length; index++) {
                  const element = clear_body[index];
                  if (element.indexOf("Host") == 0) {
                    host = element.split(": ")[1];
                  }
                }
                insertRequestResult(
                  privacyId,
                  "HTTP",
                  host,
                  method,
                  body,
                  "",
                  data.result.message.payload.messages["dst_addr"] +
                    data.result.message.payload.messages["dst_port"] +
                    data.result.message.payload.messages["src_addr"] +
                    data.result.message.payload.messages["src_port"],
                  "ok"
                );
                req_data[
                  data.result.message.payload.messages["dst_addr"] +
                    data.result.message.payload.messages["dst_port"] +
                    data.result.message.payload.messages["src_addr"] +
                    data.result.message.payload.messages["src_port"]
                ] = {
                  send: data.result,
                };
              }
            } else if (
              data.result.message.payload.messages["function"] == "HTTP_recv"
            ) {
              if (data.result.message.payload.messages["src_port"] != 443) {
                // HTTP 接受
                var body = data.result.payload;
                var clear_body = body.split("..");
                var code = 0;
                if (clear_body[0].indexOf("200") != -1) {
                  code = 200;
                } else if (clear_body[0].indexOf("500") != -1) {
                  code = 500;
                }
                upsertRequestResult(
                  privacyId,
                  "HTTP",
                  "ok",
                  code,
                  data.result.payload,
                  "",
                  data.result.message.payload.messages["src_addr"] +
                    data.result.message.payload.messages["src_port"] +
                    data.result.message.payload.messages["dst_addr"] +
                    data.result.message.payload.messages["dst_port"]
                );
                req_data[
                  data.result.message.payload.messages["src_addr"] +
                    data.result.message.payload.messages["src_port"] +
                    data.result.message.payload.messages["dst_addr"] +
                    data.result.message.payload.messages["dst_port"]
                ]["recv"] = data.result;
              }
            }
          }
        });
        this.$router.push({ name: "mark", query: { recordsID: privacyId } });
      },
      stopCheck(appInfo) {
        //清除部分localStorage
        $q.localStorage.set("mark-step", 0);
        appInfoStore.clearAppInfo();

        checkAppInfo.package = "";
        checkAppInfo.id = "";
        $q.localStorage.set("appInfo-checkId", "");
        $q.localStorage.set("appInfo-checkPackageName", "");
        socketio.send("hook_manager", {
          type: "stop",
          app: appInfo.package,
          sleep: 0,
          script: "",
          mode: "default", // 通用、特殊
        });
        $q.notify({
          position: "center",
          progress: true,
          color: "green",
          message: appInfo.name + " 停止检测成功！",
          actions: [{ icon: "close", color: "white" }],
        });
        socketio.receive("stop_check", (data) => {});
      },
      continueCheck() {
        let id = $q.localStorage.getItem("appInfo-checkId");
        this.$router.push({ name: "mark", query: { recordsID: id } });
      },
      searchApp(rows) {
        return rows.filter((item) => {
          return item.name.indexOf(data.filter) != -1;
        });
      },
    };
  },
});
</script>

<style scoped>
.click-enable {
  -webkit-app-region: no-drag;
}
</style>

<style lang="sass">
.custom-table-sticky
  .q-table__middle
    max-height: calc(100vh - 70px)

  .q-table__top
    padding: 0px
  .q-table__bottom,
  thead tr:first-child th
    background-color: #fff

  thead tr:first-child th
    top: 0

  thead tr th
    position: sticky
    z-index: 1

// 图片底部信息区域
.absolute-bottom
  margin-bottom: 40px
  .detail-box
    .detail-msg
      font-size: 12px
      text-align: left
      margin: 10px auto 0 auto
      width: 305px
      line-height: 10px
      vertical-align: middle

// 应用列表的头部样式
.app-list-top-style
  width: 100%
  display: flex
  align-items: center
  justify-content: space-between
  padding: 12px 16px
</style>
