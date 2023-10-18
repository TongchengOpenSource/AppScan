<template>
  <Suspense><TopColumnVue type="major" @download="downLoad" /></Suspense>
  <q-tabs
    v-model="tab"
    dense
    full
    class="grey-2 bg-white"
    active-color="primary"
    indicator-color="primary"
    align="justify"
  >
    <q-tab name="follows" label="关注列表" />
    <q-tab name="networkBehavior" label="网络行为" />
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
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import TopColumnVue from "../models/TopColumn.vue";
import FollowListVue from "../models/FollowList.vue";
import NetworkBehaviorVue from "../models/NetworkBehavior.vue";
import { useRouter } from "vue-router";
import { getMethod, getGroup } from "src/indexed_db/method";
import { getRequest } from "src/indexed_db/request";
import { exportJson2Excel } from "src/utils/download";

const columns = [];
const rows = [];
const followList = ref([]);
const networkList = ref([]);
const followGroup = ref([]);
var searchTypeKey = ref("");
var recordsID = ref(-1);
function searchType(type) {
  if (type == searchTypeKey.value) {
    type = "";
  }
  getMethod(recordsID.value, 0, 0, 0, type).then((res) => {
    followList.value = res;
    searchTypeKey.value = type;
  });
}
export default defineComponent({
  name: "MajorPage",
  components: {
    TopColumnVue,
    FollowListVue,
    NetworkBehaviorVue,
  },
  setup() {
    const router = useRouter();
    onMounted(async () => {
      if (router.currentRoute.value.query.recordsID) {
        recordsID.value = parseInt(router.currentRoute.value.query.recordsID);
        followList.value = await getMethod(
          recordsID.value,
          0,
          0,
          0,
          searchTypeKey.value
        );
        followGroup.value = await getGroup(recordsID.value, 0, 0);
        networkList.value = await getRequest(recordsID.value, 0, "");
      }
    });
    return {
      columns,
      rows,
      tab: ref("follows"),
      followList,
      networkList,
      followGroup,
      searchType,
      searchTypeKey,
      async downLoad() {
        let methods = await getMethod(recordsID.value, 0, 0, 0, "");
        let data = [];
        for (let index = 0; index < methods.length; index++) {
          const method = methods[index];
          data.push({
            序号: index + 1,
            主体: method.main,
            操作行为: method.action,
            堆栈: method.data,
          });
        }
        exportJson2Excel(data, "关注列表.xlsx", "关注列表");
      },
    };
  },
});
</script>
