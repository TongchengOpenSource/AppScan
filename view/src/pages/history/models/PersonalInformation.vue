<template>
  <div class="bg-white q-pa-md">
    <q-table
      dense
      flat
      :title="titleName"
      class="custom-table-sticky"
      :rows-per-page-options="[10, 20]"
      :loading="loading"
      :rows="data"
      :columns="columns"
      row-key="name"
    >
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
            <div class="col-3 text-weight-light">行为时间:</div>
            <div class="col-9">
              {{ moment(info.updatedAt * 1000).format("YYYY-MM-DD HH:mm:ss") }}
            </div>
            <div class="col-3 text-weight-light">执行主体:</div>
            <div class="col-9">{{ info.sdk_name }}</div>
            <div class="col-3 text-weight-light">操作行为:</div>
            <div class="col-9">{{ info.action }}</div>
            <div class="col-3 text-weight-light">问题标记:</div>
            <div class="col-9">{{ info.question }}</div>
            <div class="col-3 text-weight-light">data:</div>
            <div class="col-9">
              <div class="q-pa-sm shadow-1 scroll">{{ info.data }}</div>
            </div>
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
    name: "sdk_name",
    label: "主体",
    field: "sdk_name",
    align: "center",
  },
  {
    name: "action",
    label: "操作行为",
    field: "action",
    align: "center",
  },
  {
    name: "question",
    label: "问题标记",
    align: "center",
    field: "question",
  },
  {
    name: "actions",
    label: "操作",
    align: "center",
  },
];

export default defineComponent({
  name: "RiskDetected",
  props: {
    titleName: String,
    entity: String,
    data: Array,
  },
  setup() {
    var info = ref({});
    let showDialog = ref(false);
    function showInfo(record) {
      showDialog.value = !showDialog.value;
      info.value = record;
    }
    return {
      columns,
      loading: ref(false),
      info,
      showInfo,
      showDialog,
      moment,
    };
  },
});
</script>
