<template>
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
                <q-checkbox
                  v-model="autoEnableFridaHelp"
                  @update:model-value="handleAutoEnableFridaHelp"
                />
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
                <q-item-label
                  >Frida调试助手
                  <q-badge align="top" v-if="enableFridaHelp"
                    >端口: {{ fridaHelpStore.port }}
                  </q-badge></q-item-label
                >
                <q-item-label caption>
                  开启Frida助手后，才可以访问APP中访问，并进行动态检测
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  color="blue"
                  v-model="enableFridaHelp"
                  @update:model-value="handleToggleFridaHelp"
                />
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
      handleAutoEnableFridaHelp(enable) {},
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
