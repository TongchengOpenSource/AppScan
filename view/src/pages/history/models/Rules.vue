<template>
  <div fit class="bg-white q-p-md bg-white">
    <div class="q-pa-md">
      <div class="text-h5 row inline">{{ titleName }}</div>
      <q-chip dense class="bg-white float-right">
        <q-avatar color="green" text-color="white">
          <div class="text-weight-bolder text-subtitle2">
            {{ statistics.low }}
          </div>
        </q-avatar>
        低风险
      </q-chip>
      <q-chip dense class="bg-white float-right">
        <q-avatar color="orange" text-color="white">
          <div class="text-weight-bolder text-subtitle2">
            {{ statistics.medium }}
          </div>
        </q-avatar>
        中风险
      </q-chip>
      <q-chip dense class="bg-white on-right float-right">
        <q-avatar color="red" text-color="white">
          <div class="text-weight-bolder text-subtitle2">
            {{ statistics.high }}
          </div>
        </q-avatar>
        高风险
      </q-chip>
    </div>
    <q-list class="rounded-borders">
      <q-expansion-item class="full-width" v-for="(risk, i) in data" :key="i">
        <template v-slot:header>
          <q-item-section avatar>
            <q-avatar
              :icon="stateIcon(risk.option)"
              :class="stateTextColor(risk.option)"
              text-color="white"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ risk.project }} </q-item-label>
            <q-item-label caption>{{ risk.standard }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div :class="'text-' + riskColor(risk.riskLevel)">
              <q-icon name="warning" :color="riskColor(risk.riskLevel)" />{{
                riskText(risk.riskLevel)
              }}
            </div>
          </q-item-section>
        </template>

        <q-card>
          <q-card-section class="q-px-lg q-py-md q-py-none shadow-2">
            <q-form>
              <q-option-group
                :options="risk.options"
                type="radio"
                v-model="risk.option"
                @update:model-value="submit(risk)"
              />
              <q-input
                outline
                label="结果描述"
                dense
                autogrow
                v-model="risk.suggest"
                @update:model-value="submit(risk)"
                type="text"
              >
                <template v-slot:prepend>
                  <q-btn round dense flat icon="lightbulb" />
                </template>
              </q-input>
            </q-form>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, reactive } from "vue";
import { stateTextColor, stateIcon, riskText, riskColor } from "@utils/format";

let statistics = reactive({
  high: 0,
  medium: 0,
  low: 0,
});

function initData(list) {
  statistics = reactive({
    high: 0,
    medium: 0,
    low: 0,
  });
  if (!list) {
    return;
  }
  for (let index = 0; index < list.length; index++) {
    list[index].options = [
      { label: list[index].okText, value: 1 },
      { label: list[index].failText, value: 0 },
      { label: "待检测", value: -1 },
    ];
  }
  for (let index = 0; index < list.length; index++) {
    switch (list[index].riskLevel) {
      case 0:
        statistics.low++;
        break;
      case 1:
        statistics.medium++;
        break;
      case 2:
        statistics.high++;
        break;
    }
  }
}

export default defineComponent({
  name: "RulesVue",
  props: {
    titleName: String,
    data: Array,
  },
  setup(props, context) {
    initData(props.data);
    return {
      stateTextColor,
      stateIcon,
      riskText,
      riskColor,
      statistics,
      submit(risk) {
        context.emit("submit", risk);
      },
      initData,
    };
  },
});
</script>
<style lang="sass">
</style>
