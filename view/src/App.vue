<template>
  <q-inner-loading :showing="loading" label="12131">
    <q-spinner-gears size="50px" color="primary" />
  </q-inner-loading>
  <router-view v-if="!loading" />
</template>

<script>
import { defineComponent, ref, onBeforeMount } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";

export default defineComponent({
  name: "App",
  setup() {
    let loading = ref(true);
    const $q = useQuasar();
    var _hmt = _hmt || [];

    // 百度统计
    (function () {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?0df92338862a0d64f6f993e3c4627e72";
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(hm, s);
    })();

    window.systemApi.watchLog();
    // 窗口启动好之后，开始启动Frida助手
    window.systemApi.startFridaHelp().then(({ success, port }) => {
      if (success) {
        loading.value = false;
        api.defaults.baseURL = `http://127.0.0.1:${port}/api/v1`;
        // TODO 测试本地
        // api.defaults.baseURL = `http://127.0.0.1:8848/api/v1`;
      }
    });
    // 设置监听点，当用户点击叉号时触发
    window.systemApi.clickClose(() => {
      let id = $q.localStorage.getItem("appInfo-checkId");
      if (id) {
        // 当正在打标中
        $q.dialog({
          title: "提示",
          message: "您还有应用正在打标中，是否继续关闭",
          cancel: true,
          persistent: true,
          ok: "确定",
          cancel: "取消",
        })
          .onOk(() => {
            window.systemApi.judgeIsMark(true);
          })
          .onCancel(() => {
            window.systemApi.judgeIsMark(false);
          });
      } else {
        window.systemApi.judgeIsMark(true);
      }
    });

    // 禁止用户刷新
    function prohibitRefresh() {
      window.onkeydown = function (e) {
        let ev = window.event || e;
        let code = ev.keyCode || ev.which;
        if (code == 82 && (ev.metaKey || ev.ctrlKey)) {
          return false;
        }
      };
    }
    prohibitRefresh();

    onBeforeMount(() => {
      // 清除正在打标的应用
      localStorage.clear();
    });

    return {
      loading,
    };
  },
});
</script>
