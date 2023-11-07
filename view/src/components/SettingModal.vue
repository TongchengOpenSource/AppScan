<template>
  <!-- <q-dialog v-model="settingDialog" @hide="hideSettingDialog" @before-show="showSettingDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">高级设置</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-mx-auto">
          <div class="q-gutter-sm row items-center q-mb-lg">
            <q-icon name="help" size="xs" color="grey">
              <q-tooltip anchor="top middle" self="center middle">
                <strong>
                  appScan检测软件使用的引擎,
                  默认使用通用引擎,如出现app闪退和抓取不到数据等异常情况可尝试使用特殊引擎
                </strong>
              </q-tooltip>
            </q-icon>
            <span class="col"><strong>检测引擎：</strong></span>
            <q-radio v-model="engineSelect" val="default" label="通用" size="xs" class="col" />
            <q-radio v-model="engineSelect" val="custom" label="特殊" size="xs" class="col" />
          </div>
          <div class="q-gutter-sm row items-center">
            <q-icon name="help" size="xs" color="grey">
              <q-tooltip anchor="top middle" self="center middle">
                <strong>检测引擎插桩在app启动时的插桩时机, 默认0s即启动时立刻插桩,
                  如出现插桩失败获取不到数据时可尝试放开时间</strong>
              </q-tooltip>
            </q-icon>
            <span class="col-4"><strong>等待时间：</strong></span>
            <q-slider v-model="waitTime" :min="0" :max="5" :label-value="waitTime + 's'" label color="primary"
              switch-label-side switch-marker-labels-side class="col" markers />
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="text-primary row justify-evenly">
        <q-btn flat label="取消" v-close-popup />
        <q-btn flat label="保存" @click="saveSetting" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog> -->

  <q-dialog v-model="visible" position="standard">
    <q-card style="min-width: 550px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">系统设置</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-pa-none">
        <q-scroll-area :visible="false" style="height: 300px">
          <q-list>
            <q-item-label header>偏好设置</q-item-label>
            <q-item tag="label" v-ripple>
              <q-item-section side top>
                <q-checkbox v-model="autoEnableFridaHelp" @update:model-value="handleAutoEnableFridaHelp" />
              </q-item-section>

              <q-item-section>
                <q-item-label>自动开启Frida助手</q-item-label>
                <q-item-label caption>
                  开启后，在应用启动后自动启动到Frida服务（可能会影响服务启动时间）
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item-label header>通用设置</q-item-label>
            <q-item tag="label" v-ripple>
              <q-item-section>
                <q-item-label>Frida调试助手
                  <q-badge align="top" v-if="enableFridaHelp">端口: {{ fridaHelpStore.port }}
                  </q-badge></q-item-label>
                <q-item-label caption>
                  开启Frida助手后，才可以访问APP中访问，并进行动态检测
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle color="blue" v-model="enableFridaHelp" @update:model-value="handleToggleFridaHelp" />
              </q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item-label header>其他设置</q-item-label>
          </q-list>
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useFridaHelpStore } from "stores/frida-helper";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "SettingModal",
  setup() {
    const fridaHelpStore = useFridaHelpStore();
    let { enableFridaHelp } = storeToRefs(fridaHelpStore);
    return {
      fridaHelpStore,
      drawer: ref(true),
      miniState: ref(true),
      activeMenu: ref("app"),
      visible: ref(false),
      autoEnableFridaHelp: ref(false),
      enableFridaHelp,
      handleToggleFridaHelp(enable) {
        if (enable) {
          window.systemApi.startFridaHelp().then((port) => {
            fridaHelpStore.setPort(port);
          });
          return;
        }
        window.systemApi.stopFridaHelp();
        fridaHelpStore.setPort(0);
      },
      handleAutoEnableFridaHelp(enable) { },
      minimize() {
        if (process.env.MODE === "electron") {
          window.electron.minimize();
        }
      },
      toggleMaximize() {
        if (process.env.MODE === "electron") {
          window.electron.toggleMaximize();
        }
      },

      closeApp() {
        if (process.env.MODE === "electron") {
          window.electron.close();
        }
      },
    };
  },
});
</script>
