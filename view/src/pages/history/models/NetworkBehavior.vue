<template>
  <div class="bg-white q-pa-md">
    <q-table
      dense
      flat
      :title="titleName"
      class="custom-table-sticky"
      :rows-per-page-options="[10, 20, 30]"
      :loading="loading"
      :rows="data"
      :columns="columns"
      row-key="id"
      :filter="filterText"
      :filter-method="searchApp"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filterText"
          placeholder="搜索域名"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:no-data>
        <div class="full-width row flex-center q-pa-md q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span> 暂未发现您想找的信息 </span>
        </div>
      </template>
      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            color="primary"
            @click="showInfo(props.row)"
            label="查看详情"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-separator spaced inset />
        <q-card-section class="col q-pt-none">
          <div class="row">
            <div class="col-3 text-weight-light">请求时间:</div>
            <div class="col-9">
              {{ moment(info.updatedAt * 1000).format("YYYY-MM-DD HH:mm:ss") }}
            </div>
            <div class="col-3 text-weight-light">Method:</div>
            <div class="col-9">{{ info.method }}</div>
          </div>
          <div class="row">
            <q-tabs
              v-model="infoTab"
              full
              align="justify"
              class="grey-2 bg-white"
              active-color="primary"
              indicator-color="primary"
              no-caps
            >
              <q-tab name="head" label="RequestBody" />
              <q-tab name="body" label="ResponseBody" />
            </q-tabs>
          </div>
          <div class="row">
            <q-tab-panels
              v-model="infoTab"
              class="bg-grey-2"
              animated
              swipeable
              vertical
              transition-prev="jump-up"
              transition-next="jump-up"
            >
              <q-tab-panel name="head">
                <div class="q-pa-sm shadow-1 scroll dialog-style">
                  {{ info.request_body }}
                </div>
              </q-tab-panel>
              <q-tab-panel name="body">
                <div class="q-pa-sm shadow-1 scroll dialog-style">
                  {{ info.response_body }}
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import moment from "moment";
const columns = [
  {
    name: "updatedAt",
    label: "发生时间",
    align: "center",
    field: "updatedAt",
    format: (text, row) => {
      return moment(text * 1000).format("YYYY-MM-DD HH:mm:ss");
    },
  },
  {
    name: "status",
    label: "状态",
    field: "status",
    align: "center",
  },
  {
    name: "type",
    label: "类型",
    field: "type",
    align: "center",
  },
  {
    name: "Host",
    label: "域名",
    align: "center",
    field: "host",
  },
  {
    name: "method",
    label: "Method",
    align: "center",
    field: "method",
  },
  {
    name: "actions",
    label: "操作",
    align: "center",
  },
];

const showDialog = ref(false);

var info = ref({});
var infoTab = ref("head");

function showInfo(record) {
  showDialog.value = !showDialog.value;
  info.value = record;
  infoTab.value = "head";
}

export default defineComponent({
  name: "RiskDetected",
  props: {
    titleName: String,
    entity: String,
    data: Array,
  },
  setup(props) {
    const filterText = ref("");
    function searchApp(data) {
      return data.filter((item) => {
        return item.host.indexOf(filterText.value) != -1;
      });
    }
    return {
      filterText,
      columns: columns,
      loading: ref(false),
      searchApp,
      info,
      showInfo,
      showDialog,
      infoTab,
      moment,
    };
  },
});
</script>
<style lang="sass">
.dialog-style
  width: 300px
</style>
