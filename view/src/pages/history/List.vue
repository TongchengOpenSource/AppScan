<template>
  <div
    class="history-top-style q-electron-drag bg-white"
    style="position: fixed; top: 0; width: 100%; z-index: 1"
  >
    <div class="q-table__title">检测记录</div>
    <q-input
      dense
      outlined
      click-enable
      v-model="filterHistory"
      autofocus
      placeholder="搜索"
      style="-webkit-app-region: no-drag"
      @keydown.enter="searchHistory"
    >
      <template v-slot:append>
        <q-icon name="search" @click="searchHistory" class="cursor: no-drop;" />
      </template>
    </q-input>
    <div style="width: 15%"></div>
  </div>
  <div class="bg-white" style="padding-top: 64px">
    <q-separator />
    <q-list padding class="q-pa-none">
      <template v-for="(info, i) in pageData" :key="i">
        <q-item clickable v-ripple>
          <q-item-section side>
            <q-avatar rounded size="48px" class="shadow-2">
              <img :src="info.icon" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ info.appName }}</q-item-label>
            <q-item-label caption
              >版本: {{ info.version }} 包名:{{ info.appPackage }} <br />
              检测时间:
              {{
                moment(info.createdAt * 1000).format("YYYY-MM-DD HH:mm:ss")
              }}</q-item-label
            >
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              rounded
              color="primary"
              label="查看检测结果"
              @click="jumpToResult(info)"
            />
            <q-btn flat rounded label="删除" @click="deleteRecord(info)" />
          </q-item-section>
        </q-item>
        <q-separator />
      </template>
    </q-list>
    <div class="q-pa-lg flex flex-center">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :min="1"
        :max-pages="5"
        direction-links
        :input-style="{ width: '50px' }"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { getPrivacy } from "src/indexed_db/records";
import moment from "moment";
import { useAppInfoStore } from "stores/app-info";
import { useQuasar } from "quasar";
import { deleteRecordAll } from "src/utils/indexDb";
var data = ref([]);
let $q = null;

async function deleteRecord(record) {
  $q.dialog({
    title: "删除检测记录",
    message:
      "确定删除于" +
      moment(record.createdAt * 1000).format("YYYY-MM-DD HH:mm:ss") +
      "创建的" +
      record.appName +
      "扫描记录嘛?",
    cancel: true,
    persistent: true,
    ok: "确定删除",
    cancel: "取消",
  }).onOk(() => {
    deleteRecordAll(record.id);
    data.value = data.value.filter((item) => {
      return item.id != record.id;
    });
    $q.notify({
      message: "删除记录成功",
      position: "center",
      caption:
        record.appName +
        "  " +
        moment(record.createdAt * 1000).format("YYYY-MM-DD HH:mm:ss"),
      color: "secondary",
    });
  });
}

export default defineComponent({
  name: "ApplicationPage",
  setup() {
    $q = useQuasar();
    const appInfoStore = useAppInfoStore();
    (async () => {
      data.value = await getPrivacy();
    })();
    let filterHistory = ref(""); // 用户输入的搜索历史值
    let tempFilterHistory = ref(""); // filterData根据此来判断是否计算新值
    let currentPage = ref(1); // 当前页数
    const itemsPerPage = ref(10); // 分页的每页数据行数

    // 通过输入框输入的值过滤后的数据
    const filterData = computed(() => {
      if (tempFilterHistory.value === "") {
        return data.value;
      } else {
        return data.value.filter((item) => {
          return item.appName.includes(tempFilterHistory.value);
        });
      }
    });

    // 当前页的数据
    const pageData = computed(() => {
      // 获取页面信息
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = currentPage.value * itemsPerPage.value;
      return filterData.value.slice(startIndex, endIndex);
    });

    // 历史数据的分页最大值
    const totalPages = computed(() => {
      // 向上取整
      return Math.ceil(filterData.value.length / itemsPerPage.value);
    });

    function searchHistory() {
      if (tempFilterHistory.value !== filterHistory.value) {
        // 触发 filterData 进行更新
        tempFilterHistory.value = filterHistory.value;
      }
    }

    return {
      data,
      moment,
      deleteRecord,
      filterHistory,
      tempFilterHistory,
      searchHistory,
      filterData,
      currentPage,
      itemsPerPage,
      totalPages,
      pageData,
      jumpToResult(appInfo) {
        appInfoStore.setAppId(appInfo.id);
        this.$router.push("/record/result?recordsID=" + appInfo.id);
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

// 历史列表的头部样式
.history-top-style
  position: fixed
  width: 100%
  display: flex
  align-items: center
  justify-content: space-between
  top: 0
  width: 100%
  z-index: 1
  padding: 12px 16px
</style>
