<template>
  <q-dialog v-model="errorSubmitDialog">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">错误信息提交</div>
      </q-card-section>

      <q-card-section>
        <q-input
          label="错误描述"
          v-model="errorInfo.errorDescription"
          type="text"
          maxlength="50"
          :rules="[
            (val) => val.length <= 50 || '输入的长度不超过50字符',
            (val) => val.length > 0 || '请输入字符，不能为空',
          ]"
        >
          <template v-slot:prepend> <q-icon name="description" /> </template>
        </q-input>
        <q-input
          label="填写联系方式"
          v-model="errorInfo.email"
          lazy-rules
          :rules="[(val) => val.length > 0 || '请输入字符，不能为空']"
        >
          <template v-slot:prepend> <q-icon name="mail" /> </template>
        </q-input>
      </q-card-section>

      <q-card-actions class="text-primary row justify-evenly">
        <!-- <q-btn flat label="不在提醒" v-close-popup /> -->
        <q-btn flat label="取消" v-close-popup />
        <q-btn
          flat
          label="提交信息"
          @click="submitErrorInfo"
          :disable="errorInfo.email == '' && errorInfo.errorDescription == ''"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script >
import { defineComponent, ref, reactive } from "vue";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "ErrorSubmitDialog",
  emits: ["submitErrorInfo"],
  setup() {
    let errorSubmitDialog = ref(false); // 错误信息提交弹窗
    let errorInfo = reactive({
      errorDescription: "",
      email: "",
      appscanVersions: "",
      androidVersions: "",
      phoneModel: "",
    });
    const $q = useQuasar();

    // 提交错误信息
    function submitErrorInfo() {
      // 将错误信息发送
      // 是否能通过解构赋值优化代码
      window.systemApi
        .uploadErrorLog(
          errorInfo.errorDescription,
          errorInfo.email,
          errorInfo.appscanVersions,
          errorInfo.androidVersions,
          errorInfo.phoneModel
        )
        .then((res) => {
          let { code, message, success } = JSON.parse(res);
          if (success) {
            $q.dialog({
              title: "提交正常",
              message: "您已成功提交报错，感谢",
              ok: "确定",
            });
          } else {
            $q.dialog({
              title: "请求错误",
              message: "错误信息:参数验证失败",
              ok: "确定",
            });
          }
          // 将存储的信息清空
          Object.keys(errorInfo).forEach((key) => {
            errorInfo[key] = "";
          });
        })
        .catch((rej) => {
          // 当服务器出现故障时，提示报错
          if (rej) {
            $q.dialog({
              title: "警告",
              message: "服务器故障，请稍后再次尝试",
              ok: "确定",
            });
          }
        });
    }
    return {
      errorSubmitDialog,
      errorInfo,
      submitErrorInfo,
    };
  },
});
</script>

<style></style>
