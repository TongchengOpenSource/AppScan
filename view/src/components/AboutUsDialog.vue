<template>
  <q-dialog v-model="alert">
    <q-card class="about-us-style">
      <q-toolbar>
        <div class="text-h6">关于 AppScan</div>
        <q-space />
        <q-btn flat round dense fab-mini icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-toolbar>
      <q-card-section class="q-pt-none">
        <span class="text-subtitle1 text-grey-8">简介</span>
        <table>
          <tr>
            <th>版本信息</th>
            <td>{{ synopsis.version }}</td>
          </tr>
          <tr>
            <th>引擎信息</th>
            <td>{{ synopsis.engine }}</td>
          </tr>
          <tr>
            <th>具体介绍</th>
            <td>
              {{ synopsis.introduce }}
            </td>
          </tr>
          <tr>
            <th>项目地址</th>
            <td @click="openIssues">{{ synopsis.github }}</td>
          </tr>
          <tr>
            <th>下载地址</th>
            <td @click="openIssues">{{ synopsis.download }}</td>
          </tr>
          <tr>
            <th>反馈问题</th>
            <td @click="openIssues">{{ synopsis.link }}</td>
          </tr>
        </table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from "vue";
import { getVersion, getHistory } from "@api/about-us";
// 模拟版本数据
const history = { data: [] };
function openIssues() {
  window.systemApi.openIssues();
}

export default defineComponent({
  name: "AboutUsDialog",

  setup() {
    const alert = ref(false);
    // 简介数据
    const synopsis = reactive({
      version: "",
      engine: "frida-helper",
      introduce:
        "一款自动化隐私检测工具,基于动态分析,可以精准定位APP的违规风险点",
      link: "https://github.com/tongcheng-security-team/AppScan/issues",
      download: "https://github.com/TongchengOpenSource/AppScan/releases",
      github: "https://github.com/TongchengOpenSource/AppScan",
    });
    // 获取版本数据
    synopsis.version = getVersion();

    return {
      alert,
      synopsis,
      history,
      openIssues,
    };
  },
});
</script>

<style lang="scss" scoped>
/* 关于我们弹框样式 */
.about-us-style {
  width: 80vw;
  height: 50vw;

  * {
    font-size: 0.7rem;
  }
  .text-h6 {
    font-size: 1rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  td {
    border: 1px solid #e7ebee;
    padding: 10px;
  }

  th {
    background-color: #e0e2e5;
    width: 13%;
    border: 1px solid #e7ebee;
    font-size: 0.9em;
  }
  // toolbar区域
  .q-toolbar {
    min-height: 45px;
  }

  // section 区域样式
  .q-card__section {
    padding-bottom: 0;
  }

  /* 滚动区域 */
  .scroll-area {
    height: 160px;
    margin-top: 5px;
    max-width: 100%;

    .scroll-ul {
      padding-left: 5px;
      margin-top: 0;
      li {
        list-style: none;
      }

      li:before {
        content: "";
        display: inline-block;
        width: 5px;
        height: 5px;
        background-color: $grey-5;
        border-radius: 50%;
        margin-right: 5px;
      }
    }
  }
}
</style>
