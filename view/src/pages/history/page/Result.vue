<template>
  <Suspense><TopColumnVue type="result" @download="downLoad" /></Suspense>
  <q-tabs
    v-model="tab"
    dense
    full
    class="grey-2 bg-white"
    active-color="primary"
    indicator-color="primary"
    align="justify"
  >
    <q-tab name="riskDetected" label="存在的风险" />
    <q-tab name="useRules" label="使用规则" />
    <q-tab name="saveRules" label="保存规则" />
    <q-tab name="externalRules" label="对外提供规则" />
    <q-tab name="collectionRules" label="收集规则" />
    <q-tab name="expressConsent" label="明示同意" />
    <q-tab name="termStatus" label="条款状态" />
    <q-tab name="userPermissions" label="用户权限" />
    <q-btn-dropdown auto-close stretch flat icon="more" label="更多...">
      <q-list>
        <!-- TODO 嵌入SDK暂未启用 -->
        <!-- <q-item clickable @click="tab = 'sdks'">
          <q-item-section>应用嵌入的第三方SDK</q-item-section>
        </q-item> -->

        <q-item clickable @click="tab = 'appGetInformation'">
          <q-item-section>应用自身获取个人信息行为</q-item-section>
        </q-item>
        <q-item clickable @click="tab = 'sdkGetInformation'">
          <q-item-section>第三方SDK获取个人信息行为</q-item-section>
        </q-item>
        <q-item clickable @click="tab = 'appPermissions'">
          <q-item-section>应用权限信息</q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </q-tabs>
  <q-tab-panels
    v-model="tab"
    class="bg-grey-2"
    animated
    swipeable
    vertical
    transition-prev="jump-up"
    transition-next="jump-up"
  >
    <q-tab-panel name="riskDetected">
      <Suspense>
        <template #default>
          <risk-rules-vue
            titleName="存在的风险"
            ref="riskRules"
            @submit="updateMark"
          />
        </template>
        <template #fallback>
          <div>加载中...</div>
        </template>
      </Suspense>
    </q-tab-panel>
    <q-tab-panel name="useRules">
      <rules-vue
        titleName="使用规则"
        :data="ruleMap[USR_RULES]"
        ref="rules"
        @submit="updateMark"
      />
    </q-tab-panel>
    <q-tab-panel name="saveRules">
      <rules-vue
        titleName="保存规则"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[SAVE_RULES]"
      />
    </q-tab-panel>
    <q-tab-panel name="externalRules">
      <rules-vue
        titleName="对外提供规则"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[EXTERNAL_RULES]"
      />
    </q-tab-panel>
    <q-tab-panel name="collectionRules">
      <rules-vue
        titleName="收集规则"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[COLLECTION_RULES]"
      />
    </q-tab-panel>
    <q-tab-panel name="expressConsent">
      <rules-vue
        titleName="明示同意"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[EXPRESS_CONSENT]"
      />
    </q-tab-panel>
    <q-tab-panel name="termStatus">
      <rules-vue
        titleName="条款状态"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[TERM_STATUS]"
      />
    </q-tab-panel>
    <q-tab-panel name="userPermissions">
      <rules-vue
        titleName="用户权限"
        @submit="updateMark"
        ref="rules"
        :data="ruleMap[USER_PERMISSIONS]"
      />
    </q-tab-panel>
    <q-tab-panel name="sdks">
      <sdks-vue titleName="应用嵌入的第三方SDK" />
    </q-tab-panel>
    <q-tab-panel name="sdkGetInformation">
      <personal-information-vue
        entity="sdk"
        titleName="第三方SDK获取个人信息行为"
        :data="sdks"
      />
    </q-tab-panel>
    <q-tab-panel name="appGetInformation">
      <personal-information-vue
        entity="app"
        titleName="应用自身获取个人信息行为"
        :data="apps"
      />
    </q-tab-panel>

    <q-tab-panel name="appPermissions">
      <permissions-vue titleName="应用权限信息" :data="followGroup" />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import RulesVue from "./../models/Rules.vue";
import RiskRulesVue from "./../models/RiskRules.vue";
import PersonalInformationVue from "./../models//PersonalInformation.vue";
import SdksVue from "./../models/Sdks.vue";
import PermissionsVue from "./../models/Permissions.vue";
import { defineComponent, reactive, ref, onMounted } from "vue";
import TopColumnVue from "../models/TopColumn.vue";
import { useQuasar } from "quasar";
import { makeAppAndSdkGetInformation, getRiskData } from "src/utils/indexDb";
import {
  getMark,
  upsertMarkResult,
  insertMarkResult,
} from "src/indexed_db/mark";
import { getGroup } from "src/indexed_db/method";
import {
  makeRuleMap,
  RISK_DETECTED,
  USR_RULES,
  SAVE_RULES,
  EXTERNAL_RULES,
  COLLECTION_RULES,
  EXPRESS_CONSENT,
  TERM_STATUS,
  USER_PERMISSIONS,
  SDKS,
  APP_GET_INFORMATION,
  SDK_GET_INFORMATION,
  APP_PERMISSIONS,
} from "src/utils/ruleData";
import { exportJson2Excel } from "src/utils/download";
export default defineComponent({
  name: "ResultPage",
  components: {
    RulesVue,
    PersonalInformationVue,
    SdksVue,
    PermissionsVue,
    TopColumnVue,
    RiskRulesVue,
  },
  async setup(props, ctx) {
    const $q = useQuasar();
    let ruleMap = reactive(makeRuleMap());
    let recordIds = $q.localStorage.getItem("appInfo-id");
    let apps = reactive([]);
    let sdks = reactive([]);
    let followGroup = reactive([]);
    onMounted(async () => {
      let marks = await getMark(recordIds);
      let resultMap = {};
      if (marks.length > 0) {
        resultMap = marks[0].result;
      } else {
        await insertMarkResult(recordIds, {});
      }
      for (var key in ruleMap) {
        let rules = ruleMap[key];
        for (let index = 0; index < rules.length; index++) {
          const rule = rules[index];
          if (resultMap[rule.id]) {
            ruleMap[key][index].option = resultMap[rule.id].option;
            ruleMap[key][index].suggest = resultMap[rule.id].suggest;
          }
        }
      }
    });
    let res = await makeAppAndSdkGetInformation(recordIds);
    apps = res.apps;
    sdks = res.sdks;
    followGroup = await getGroup(recordIds, 0, 0);
    followGroup = followGroup.filter((item) => {
      return item.count > 0;
    });
    return {
      apps,
      sdks,
      tab: ref("useRules"),
      ruleMap,
      RISK_DETECTED,
      USR_RULES,
      SAVE_RULES,
      EXTERNAL_RULES,
      COLLECTION_RULES,
      EXPRESS_CONSENT,
      TERM_STATUS,
      USER_PERMISSIONS,
      SDKS,
      APP_GET_INFORMATION,
      SDK_GET_INFORMATION,
      APP_PERMISSIONS,
      followGroup,
      updateMark(risk) {
        upsertMarkResult(recordIds, risk.id, risk.option, risk.suggest);
      },
      async downLoad() {
        let marks = await getRiskData(recordIds);
        let data = [];
        for (let index = 0; index < marks.length; index++) {
          const mark = marks[index];
          let riskLevel = "";
          switch (mark.riskLevel) {
            case 0:
              riskLevel = "低风险";
            case 1:
              riskLevel = "中风险";
            case 2:
              riskLevel = "高风险";
          }
          data.push({
            序号: index + 1,
            检测项: mark.project,
            评估标准: mark.standard,
            风险等级: riskLevel,
            整改建议: mark.suggest,
          });
        }
        exportJson2Excel(data, "风险列表.xlsx", "风险");
      },
    };
  },
});
</script>
