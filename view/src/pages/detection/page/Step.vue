<template>
  <Suspense><TopColumnVue type="mark" @refresh="refresh" /></Suspense>
  <div class="q-pa-md">
    <q-tabs
      v-model="tabName"
      dense
      full
      class="grey-2 bg-white"
      active-color="primary"
      indicator-color="primary"
      align="justify"
    >
      <q-tab name="mark" :disable="markDisable" label="打标列表" />
      <q-tab name="follows" label="关注列表" />
      <q-tab name="networkBehavior" label="网络行为" />
    </q-tabs>
    <q-tab-panels
      v-model="tabName"
      color="primary"
      animated
      swipeable
      vertical
      transition-prev="jump-up"
      transition-next="jump-up"
    >
      <q-tab-panel name="mark">
        <div
          class="bg-grey-1"
          v-for="num in allMarkLen.length"
          :key="num"
          v-show="pageNum === num"
        >
          <MarkListVue
            :list="data.mark[num]"
            @submit="addMark"
            @update:performance="updatePerformance"
            :performance="isCompare[num - 1]"
            :page="num"
            :markAsyncList="data"
          />
        </div>

        <div
          class="q-mx-auto"
          style="display: flex; justify-content: center; aligin-items: center"
        >
          <q-btn
            v-if="pageNum === lenMark"
            @click="submitToDb()"
            color="primary"
            label="提交"
          />
        </div>

        <!-- 组合按钮实现上、下页以及弹出打标页面 -->
        <q-page-sticky position="bottom-right" :offset="[25, 20]">
          <q-btn-group push>
            <q-btn
              class="tool-btn"
              size="sm"
              text-color=""
              icon="keyboard_arrow_left"
              @click="reducePageNum"
            />
            <q-btn
              :label="pageNum"
              size="sm"
              @click="renderMarkDialog"
              class="tool-btn"
            />
            <q-btn
              icon="keyboard_arrow_right"
              size="sm"
              @click="addPageNum"
              class="tool-btn"
            />
          </q-btn-group>
        </q-page-sticky>
        <!-- 实现达标情况弹窗 -->
        <q-dialog v-model="markShow">
          <q-card class="mark-dialog">
            <q-card-section class="q-mx-auto">
              <div class="text-subtitle1 title-style">打标页面选项卡</div>
            </q-card-section>

            <q-card-section class="q-mx-auto q-pt-none q-gutter-sm">
              <q-btn
                v-for="n in allMarkLen.length"
                :key="n"
                :color="isCompare[n - 1] ? 'primary' : 'blue-grey-3'"
                :label="n"
                @click="markButtonClick(n)"
              />
            </q-card-section>
          </q-card>
        </q-dialog>
      </q-tab-panel>
      <q-tab-panel name="follows">
        <FollowListVue
          ref="follows"
          :data="followList"
          :list="followGroup"
          :typeKey="searchTypeKey"
          @searchType="searchType"
        />
      </q-tab-panel>
      <q-tab-panel name="networkBehavior">
        <NetworkBehaviorVue ref="networkBehavior" :data="networkList" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, reactive, watch, nextTick } from "vue";
import MarkListVue from "./../models/MarkList.vue";
import { list } from "src/utils/ruleData";
import TopColumnVue from "./../models/TopColumn.vue";
import FollowListVue from "./../../history/models/FollowList.vue";
import NetworkBehaviorVue from "./../../history/models/NetworkBehavior.vue";
import { getMethod, getGroup } from "src/indexed_db/method";
import { getRequest } from "src/indexed_db/request";
import moment from "moment";
import { useRouter } from "vue-router";
import { useAppInfoStore } from "stores/app-info";
import {
  getMark,
  insertMarkResult,
  upsertMarkResult,
} from "src/indexed_db/mark";
import { useQuasar } from "quasar";
import socketio from "@utils/socketio";

const data = reactive({ mark: {} });
const followList = ref([]);
const followGroup = ref([]);
const networkList = ref([]);
let result = {};
let recordsID = ref(-1);
let searchTypeKey = ref("");
let step = ref(1);

// 生成打标列表的数据
async function makeData(id) {
  let resultMap = {};
  let marks = await getMark(id);
  if (marks.length == 1) {
    resultMap = marks[0].result;
  } else {
    await insertMarkResult(id, {});
  }
  data.mark = {};
  for (let index = 0; index < list.length; index++) {
    let col = resultMap[list[index].id];
    if (col) {
      list[index].state = col.option;
      list[index].suggest = col.suggest;
    } else {
      list[index].state = -1;
      list[index].suggest = "";
    }
    list[index].options = [
      { label: list[index].okText, value: 1 },
      { label: list[index].failText, value: 0 },
      { label: "待检测", value: -1 },
    ];
    if (data.mark[list[index].page]) {
      data.mark[list[index].page].push(list[index]);
    } else {
      data.mark[list[index].page] = [list[index]];
    }
  }
}

function searchType(type) {
  if (type == searchTypeKey.value) {
    type = "";
  }
  getMethod(recordsID.value, 0, 0, 0, type).then((res) => {
    followList.value = res;
    searchTypeKey.value = type;
  });
}

export default {
  name: "stepVue",
  components: {
    MarkListVue,
    TopColumnVue,
    FollowListVue,
    NetworkBehaviorVue,
  },
  setup() {
    const appInfoStore = useAppInfoStore();
    const $q = useQuasar();
    const router = useRouter();
    const tabName = ref("mark");
    const markDisable = ref(false);
    let id = $q.localStorage.getItem("appInfo-checkId");
    let pageNum = ref(1); // 当前页面应该显示的页码
    let isCompare = reactive(new Array(10).fill(false)); // 当前页面的打标是否完成

    recordsID.value = parseInt(router.currentRoute.value.query.recordsID);
    watch(step, (step, prevStep) => {
      $q.localStorage.set("mark-step", step);
    });
    let localStep = $q.localStorage.getItem("mark-step");
    if (localStep) {
      step.value = localStep;
    } else {
      step.value = 1;
    }
    followList.value = [];
    followGroup.value = [];
    networkList.value = [];
    let tm;
    let markShow = ref(false); // 是否展示弹出框
    let allMarkLen = []; // 所有的打标页面长度
    let lenMark = ref(0); // 总共打标页数

    // 将打标的数据传到子组件用作获取打标情况
    function refresh() {
      if (tm) {
        clearInterval(tm);
        tm = null;
      } else {
        tm = setInterval(async () => {
          followList.value = await getMethod(
            recordsID.value,
            0,
            0,
            0,
            searchTypeKey.value
          );
          followGroup.value = await getGroup(recordsID.value, 0, 0);
          networkList.value = await getRequest(recordsID.value, 0, "");
        }, 2000);
      }
    }

    function addMark(arg) {
      result[arg.id] = {
        option: arg.option,
        suggest: arg.suggest,
      };
      upsertMarkResult(id, arg.id, arg.option, arg.suggest);
    }

    // 打标页面按钮点击
    function markButtonClick(n) {
      pageNum.value = n;
      markShow.value = false;
      scrollToTop();
    }

    // 退后一页
    function reducePageNum() {
      pageNum.value > 1 ? pageNum.value-- : pageNum.value;
      scrollToTop();
    }

    // 前进一页
    function addPageNum() {
      pageNum.value < lenMark.value ? pageNum.value++ : pageNum.value;
      scrollToTop();
    }

    // 滚动到顶部
    async function scrollToTop() {
      await nextTick();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    onMounted(async () => {
      if (router.currentRoute.value.query.recordsID) {
        recordsID.value = parseInt(router.currentRoute.value.query.recordsID);

        tm = setInterval(async () => {
          followList.value = await getMethod(
            recordsID.value,
            0,
            0,
            0,
            searchTypeKey.value
          );
          followGroup.value = await getGroup(recordsID.value, 0, 0);
          networkList.value = await getRequest(recordsID.value, 0, "");
        }, 2000);
      }
      await makeData(id);
      lenMark.value = Object.keys(data.mark).length;
      // 对每个打标页面的个数进行统计
      for (let n in data.mark) {
        allMarkLen.push(data.mark[n].length);
      }
    });

    onUnmounted(() => {
      if (tm) clearInterval(tm);
    });

    // 根据MarkList组件的打标情况更新是否高亮（全部打标）
    function updatePerformance(isHightLight, page) {
      isCompare[page - 1] = isHightLight;
    }

    // 渲染打标选项卡
    function renderMarkDialog() {
      markShow.value = true; // 显示可见
      // 统计每一项的打标情况
      for (let n in data.mark) {
        let tmpSum = 0;
        for (let mark of data.mark[n]) {
          // 非 待检测 或者是有 结果描述
          if (mark.state !== -1 || mark.suggest !== "") {
            tmpSum++;
          }
        }
        // 判断是否为高光
        if (tmpSum === allMarkLen[n - 1]) {
          isCompare[n - 1] = true;
        } else {
          isCompare[n - 1] = false;
        }
      }
    }

    return {
      step,
      data,
      tabName,
      followList,
      followGroup,
      moment,
      networkList,
      addMark,
      markDisable,
      searchTypeKey,
      searchType,
      refresh,
      pageNum, // 页码
      lenMark, // 总共打标页数
      async submitToDb() {
        // 对打标提交设计弹窗判断
        $q.dialog({
          title: "",
          message: "确认提交即结束APP打标，您是否确认提交？",
          cancel: true,
          persistent: true,
          ok: "确定提交",
          cancel: "取消",
        }).onOk(() => {
          $q.notify({
            position: "center",
            progress: true,
            color: "green",
            message: $q.localStorage.getItem("appInfo-name") + " 打标提交成功!",
            actions: [{ icon: "close", color: "white" }],
          });
          // 停止app继续检测
          let packageName = $q.localStorage.getItem("appInfo-packageName");
          socketio.send("hook_manager", {
            type: "stop",
            app: packageName,
            sleep: 0,
          });
          // 清除本地存储，使得不能检测
          $q.localStorage.set("appInfo-checkId", "");
          $q.localStorage.set("appInfo-checkPackageName", "");

          markDisable.value = true;
          tabName.value = "follows";
          $q.localStorage.set("mark-step", 0);
          appInfoStore.clearAppInfo();
          router.push({ path: "/" });
        });
      },
      isCompare, // 打标情况
      markShow, // 打标页面
      updatePerformance, // 更新选项卡高亮
      renderMarkDialog, // 展示打标页面
      allMarkLen,
      markButtonClick, // 打标按钮点击
      reducePageNum, // 后退
      addPageNum, // 前进
    };
  },
};
</script>

<style lang="scss">
.mark-dialog {
  width: 45%;

  .title-style {
    text-align: center;
  }
}
// 修改打标页面右下角按钮组件
.tool-btn {
  background-color: #ccc;
  i {
    color: #6a6a6a;
  }
}
</style>
