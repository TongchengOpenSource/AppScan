<template>
  <div fit class="bg-white q-p-md bg-white">
    <div class="q-pa-md">
      <div class="text-h5 row inline">{{ titleName }}</div>
    </div>
    <q-list class="rounded-borders">
      <q-expansion-item
        class="full-width"
        v-for="(sdk, i) in data"
        :key="i"
        :label="sdk.name"
        icon="app_shortcut"
      >
        <q-card>
          <q-card-section class="q-pa-md q-py-none">
            <div class="scroll">{{ sdk.stackTrace }}</div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";

var item = {
  name: "华为地图",
  stackTrace: `文件名称 HUAWEI`,
};

var list = [
  JSON.parse(JSON.stringify(item)),
  JSON.parse(JSON.stringify(item)),
  JSON.parse(JSON.stringify(item)),
  JSON.parse(JSON.stringify(item)),
];
export default defineComponent({
  name: "RiskDetected",
  props: {
    titleName: String,
  },
  setup() {
    return {
      data: ref(list),
    };
  },
});
</script>
