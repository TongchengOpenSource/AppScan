<template>
  <q-list class="rounded-borders">
    <q-expansion-item
      class="full-width xzy"
      v-model="defaultShow"
      v-for="(risk, i) in list"
      :key="i"
      expand-icon="none"
      hide-expand-icon
    >
      <template v-slot:header>
        <q-item-section avatar>
          <q-avatar
            :icon="stateIcon(risk.state)"
            :class="stateTextColor(risk.state)"
            text-color="white"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ risk.project }}</q-item-label>
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
              :options="risk.options ? risk.options : []"
              type="radio"
              v-model="risk.state"
              @update:model-value="submit(risk.id, risk.state, risk.suggest)"
            />
            <q-input
              outline
              label="结果描述"
              dense
              autogrow
              v-model="risk.suggest"
              @update:model-value="submit(risk.id, risk.state, risk.suggest)"
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
</template>

<script>
import { ref, reactive, watchEffect } from "vue";
import { stateTextColor, stateIcon, riskText, riskColor } from "@utils/format";
let defaultShow = true;

export default {
  name: "stepVue",
  props: {
    list: Array,
    performance: Boolean,
    page: Number,
    markAsyncList: {
      type: Object,
      required: true, // 必须是得有数据的
      default: reactive({}),
    },
  },
  emits: ["update:performance"],
  setup(props, context) {
    let mapMarking = new Map(); // 记录打标情况
    let sumMarking = 0; // 统计当前页面已打标的个数
    let markList = reactive({ data: [] }); // 为了可能用到的响应式使用对象形式
    let hasExecuteGetMark = false;

    watchEffect(
      () => {
        // 当有值传进来，方才执行(会出现无值的情况，待优化)
        if (props.markAsyncList.mark[props.page]) {
          markList["data"] = props.markAsyncList.mark[props.page];
          // 第一次进来就得对打标情况进行统计
          getMarkState();
        }
      },
      { flush: "pre" }
    );

    // 选项组数据发生更改触发的函数
    function submit(id, option, suggest) {
      context.emit("submit", { id, option, suggest });
    }

    // 获取当前页面的打标情况
    function getMarkState() {
      if (hasExecuteGetMark || markList["data"].length === 0) return;
      for (let i = 0; i < markList.data.length; i++) {
        // 添加到打标情况的map
        mapMarking.set(markList.data[i].id, markList.data[i].state);
        // 根据打标的情况进行统计
        if (markList.data[i].state === 1 || markList.data[i].state === 0) {
          sumMarking++;
        }
      }
      hasExecuteGetMark = true; // 执行过一次了
      if (markList.data.length === sumMarking) {
        context.emit("update:performance", true, props.page);
        performance = true;
      }
    }

    return {
      step: ref(1),
      defaultShow,
      sumMarking, // 统计的打标值
      markList, // 对修改后的数组存储
      stateTextColor,
      stateIcon,
      riskText,
      riskColor,
      submit,
    };
  },
};
</script>
