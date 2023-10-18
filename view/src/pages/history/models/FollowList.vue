<template>
  <div class="bg-white q-pa-md">
    <div class="q-pa-md">
      <q-chip
        square
        clickable
        v-for="item in list"
        :key="item.name"
        @click="$emit('searchType', item.name)"
      >
        <div v-if="item.name == typeKey">
          <q-avatar color="red" text-color="white">{{ item.count }}</q-avatar>
          <!-- <q-avatar text-color="black">
            <div class="text-weight-bolder">{{ item.count }}</div>
          </q-avatar> -->
          {{ item.name }}
        </div>
        <div v-else>
          <q-avatar>
            <div class="text-weight-bolder">{{ item.count }}</div>
          </q-avatar>
          {{ item.name }}
        </div>
      </q-chip>
    </div>
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
      <template v-slot:body-cell-question="props">
        <q-td :props="props" class="text-center">
          <q-select
            borderless
            clearable
            dense
            class="select-style"
            v-model="props.row.question"
            :options="options"
            @update:model-value="
              updateQuestion(props.row.id, props.row.question)
            "
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
import { signQuestion } from "src/indexed_db/method";

const options = [
  "私自收集个人信息",
  "未同步告知目的",
  "与当前业务功能无关",
  "频繁申请授权",
  "超出实现处理目的最小必要范围",
  "隐私政策末申明",
  "收集不可变更的唯一设备识别码",
];

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

const showDialog = ref(false);

var info = ref({});

function showInfo(record) {
  showDialog.value = !showDialog.value;
  info.value = record;
}

function updateQuestion(id, question) {
  signQuestion(id, question);
}

export default defineComponent({
  name: "FollowList",
  props: {
    titleName: String,
    entity: String,
    data: Array,
    list: Array,
    typeKey: String,
  },
  setup() {
    const filterText = ref("");
    return {
      filterText,
      columns: columns,
      loading: ref(false),
      info,
      showInfo,
      showDialog,
      options,
      moment,
      updateQuestion,
    };
  },
});
</script>
<style lang="sass">
.select-style
  max-width: 250px
  font-size: small
  margin: 0 auto
</style>
