<template>
  <q-layout view="lHh lpR lFf">
    <q-drawer
      v-model="drawer"
      :mini="miniState"
      mini-to-overlay
      :width="200"
      :mini-width="65"
      :breakpoint="0"
      bordered
      class="bg-grey-3 q-electron-drag"
      style="padding-top: 30px"
    >
      <q-list>
        <q-item
          clickable
          v-ripple
          class="custom-q-item"
          :active="activeMenu == 'privacy'"
          active-class="custom-drawer-active-menu"
          @click="toStep"
        >
          <q-item-section avatar class="column items-center">
            <q-icon name="important_devices " size="22px" />
            <q-item-label lines="2" class="custom-drawer-q-item-label"
              >检测</q-item-label
            >
          </q-item-section>
        </q-item>
      </q-list>
      <q-list>
        <q-item
          clickable
          v-ripple
          to="/record"
          class="custom-q-item"
          :active="activeMenu == 'record'"
          active-class="custom-drawer-active-menu"
        >
          <q-item-section avatar class="column items-center">
            <q-icon name="history" size="24px" />
            <q-item-label lines="2" class="custom-drawer-q-item-label"
              >历史</q-item-label
            >
          </q-item-section>
        </q-item>
      </q-list>
      <q-list>
        <!-- 更多显示区域 -->
        <q-item
          clickable
          v-ripple
          style="margin-bottom: 15px"
          class="custom-q-item absolute-bottom"
        >
          <q-item-section avatar class="column items-center">
            <q-icon name="more_horiz" />
          </q-item-section>
          <q-menu
            class="bg-grey-2 text-black"
            auto-close
            fit
            anchor="bottom right"
            self="bottom start"
            :offset="[15, 0]"
          >
            <q-list style="min-width: 150px">
              <!-- 关于我们 -->
              <q-item clickable @click="openAboutUs">
                <q-item-section side>
                  <q-icon
                    name="account_circle"
                    size="20px"
                    color="black"
                  ></q-icon>
                </q-item-section>
                <q-item-section>关于我们</q-item-section>
              </q-item>
              <q-separator color="grey-4" />
              <q-item clickable @click="openDocs">
                <q-item-section side>
                  <q-icon
                    name="text_snippet"
                    size="20px"
                    color="black"
                  ></q-icon>
                </q-item-section>
                <q-item-section>使用文档</q-item-section>
              </q-item>
              <!-- 检查更新 -->
              <q-separator color="grey-4" />
              <q-item
                clickable
                @click="isDowning ? (updating = true) : updateVersion(false)"
                v-ripple
              >
                <q-item-section side>
                  <q-icon
                    :name="isDowning ? 'downloading' : 'change_circle'"
                    :color="isDowning ? 'red' : 'black'"
                    size="20px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label lines="2" class="custom-drawer-q-item-label"
                    >{{ isDowning ? "下载中..." : "检查更新" }}
                    <q-icon
                      color="red"
                      v-show="isnNeedUpdate"
                      name="info"
                      rounded
                      floating
                    />
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator color="grey-4" />
              <!-- 对不同的检测方式进行设置 -->
              <q-item clickable @click="openSetting">
                <q-item-section side>
                  <q-icon name="settings" size="20px" color="black"></q-icon>
                </q-item-section>
                <q-item-section>高级设置</q-item-section>
              </q-item>
              <!-- 对报错信息提交 -->
              <q-item clickable @click="showErrorSubmitDialog">
                <q-item-section side>
                  <q-icon name="error" size="20px" color="black"></q-icon>
                </q-item-section>
                <q-item-section>报错提交</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container class="bg-grey-2">
      <Suspense>
        <template #default>
          <router-view />
        </template>
        <template #fallback>
          <span>加载中...</span>
        </template>
      </Suspense>
    </q-page-container>
  </q-layout>
  <q-dialog v-model="updating" no-backdrop-dismiss persistent no-esc-dismiss>
    <q-card class="q-pt-md" style="min-width: 450px">
      <q-list bordered padding>
        <q-item>
          <q-item-section avatar>
            <q-avatar>
              <img src="~assets/avatar.jpg" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>正在下载更新 {{ updateData.version }}</q-item-label>
            <q-item-label
              ><q-linear-progress
                stripe
                rounded
                size="15px"
                :value="updateData.process"
                color="primary"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge
                    rounded
                    transparent
                    color="white"
                    text-color="accent"
                    :label="updateData.progressLabel"
                  />
                </div>
              </q-linear-progress>
            </q-item-label>
            <q-item-label caption
              >{{ updateData.downloadSize }} /
              {{ updateData.fileSize }}
              <span class="float-right">{{ updateData.bytesPerSecond }}/s</span>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-btn
            class="absolute-right"
            flat
            size="md"
            label="后台更新"
            color="primary"
            @click="updating = false"
          />
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
  <!-- 关于我们的弹窗 -->
  <AboutUsDialog ref="aboutUs"></AboutUsDialog>
  <!-- 设置弹窗 -->
  <SettingModal ref="setting"></SettingModal>
  <!-- 错误信息提交弹窗 -->
  <errorSubmitDialog ref="errorSubmitDialogRef"></errorSubmitDialog>
</template>

<script>
import { defineComponent, ref, watch, reactive, computed } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatSize } from "src/utils/download";
import { useAppInfoStore } from "stores/app-info";
// 关于我们组件
import AboutUsDialog from "src/components/AboutUsDialog.vue";
// 错误提交组件
import errorSubmitDialog from "../components/errorSubmitDialog.vue";
// 设置组件
import SettingModal from "../components/SettingModal.vue";

let activeMenu = ref("privacy");
let updating = ref(false);
let isDowning = ref(false);

function updateVersion(bySelf) {
  //判断版本信息
  window.systemApi.checkVersion(bySelf);
}

export default defineComponent({
  name: "MainLayout",
  components: { AboutUsDialog, errorSubmitDialog },
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    //删除缓存
    const appInfoStore = useAppInfoStore();
    appInfoStore.clearAppInfo();
    let errorSubmitDialogRef = ref();
    let isnNeedUpdate = ref(false);
    let updateData = reactive({
      version: "",
      process: 0,
      progressLabel: computed(
        () => (updateData.process * 100).toFixed(2) + "%"
      ),
      fileSize: "0kb",
      downloadSize: "0kb",
      bytesPerSecond: "0kb",
    });
    updateVersion(true);
    let settingDialog = ref(false); // 设置弹窗是否显示
    let aboutUs = ref(null);
    // 下方使用三元是因为ref(null)也是个值
    let engineSelect =
      $q.localStorage.getItem("setting-engineSelect") !== null
        ? ref($q.localStorage.getItem("setting-engineSelect"))
        : ref("default"); // 设置的检测引擎
    let waitTime =
      $q.localStorage.getItem("setting-waitTime") !== null
        ? ref($q.localStorage.getItem("setting-waitTime"))
        : ref(0); // 设置的等待时间
    window.systemApi.listenUpdate((event, value) => {
      updateData.process = parseFloat(value.percent) / 100;
      updateData.fileSize = formatSize(value.total);
      updateData.downloadSize = formatSize(value.transferred);
      updateData.bytesPerSecond = formatSize(value.bytesPerSecond);
    });

    window.systemApi.listenCheckUpdate((event, config) => {
      isnNeedUpdate.value = true;
      updateData.version = config.version;
    });

    window.systemApi.listenChangeUpdateModal((event, isOpen) => {
      if (isOpen && updateData.process < 1) {
        updating.value = true;
        isDowning.value = true;
        return;
      }
      updating.value = false;
      isDowning.value = false;
    });

    const route = useRoute();
    if (route.fullPath.indexOf("/record") == -1) {
      activeMenu.value = "privacy";
    } else {
      activeMenu.value = "record";
    }
    watch(
      () => route.fullPath,
      async (fullPath) => {
        if (fullPath.indexOf("/record") == -1) {
          activeMenu.value = "privacy";
        } else {
          activeMenu.value = "record";
        }
      }
    );

    // 触发修改关于我们弹窗
    function openAboutUs() {
      aboutUs.value.alert = true;
    }
    function openDocs() {
      window.systemApi.openDocs();
    }
    // 设置弹窗
    function openSetting() {
      setting.value.visible = true;
    }
    // 保存设置(存储mode、waitTime)
    function saveSetting() {
      $q.localStorage.set("setting-engineSelect", engineSelect.value);
      $q.localStorage.set("setting-waitTime", waitTime.value);
    }

    // 关闭设置弹窗
    function hideSettingDialog() {
      // 关闭之后，获得未保存的状态
      engineSelect.value = $q.localStorage.getItem("setting-engineSelect");
      waitTime.value = $q.localStorage.getItem("setting-waitTime");
    }

    // 展示设置弹窗
    function showSettingDialog() {
      // 打开弹窗之前，对数据进行快照
      $q.localStorage.set("setting-engineSelect", engineSelect.value);
      $q.localStorage.set("setting-waitTime", waitTime.value);
    }

    // 当正在打标时，点检测跳转到正在打标的应用
    function toStep() {
      let id = $q.localStorage.getItem("appInfo-checkId");
      if (id === null || id === "") {
        router.push({ path: "/" });
      } else {
        router.push({ path: "/mark", query: { recordsID: id } });
      }
    }

    function showErrorSubmitDialog() {
      // 显示弹窗
      errorSubmitDialogRef.value.errorSubmitDialog = true;
    }

    return {
      drawer: ref(true),
      miniState: ref(true),
      activeMenu,
      updating,
      updateData,
      isnNeedUpdate,
      isDowning,
      aboutUs,
      settingDialog,
      engineSelect,
      waitTime,
      errorSubmitDialogRef,
      updateVersion,
      openDocs,
      openSetting, // 打开设置窗口
      openAboutUs,
      saveSetting,
      hideSettingDialog,
      showSettingDialog,
      toStep,
      showErrorSubmitDialog,
    };
  },
});
</script>

<style scoped lang="scss">
.custom-q-item {
  margin: 8px;
  padding-top: 0;
  color: #3e3e3e;
  padding-bottom: 0;
  -webkit-app-region: no-drag;
}
.custom-drawer-q-item-label {
  font-size: 14px;
  font-weight: 400;
}
.custom-drawer-active-menu {
  color: var(--q-primary);
}

// 错误弹窗样式
.error-dialog {
  width: 400px;
  height: 300px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
}
</style>
