<template>
  <div fit class="bg-white q-p-md bg-white">
    <div class="q-pa-md">
      <div class="text-h5 row inline">{{ titleName }}</div>
    </div>
    <q-list class="rounded-borders">
      <q-item class="full-width" v-for="(permission, i) in data" :key="i">
        <q-item-section avatar>
          <q-avatar icon="perm_device_information" />
        </q-item-section>
        <q-item-section>{{ permission.name }}</q-item-section>
        <q-item-section side top>
          <q-item-label caption>触发次数: {{ permission.count }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "PermissionsVue",
  props: {
    titleName: String,
    data: Array,
  },
  setup() {
    return {};
  },
});
</script>
