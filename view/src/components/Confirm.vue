<template>
  <q-dialog v-model="confirm" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="signal_wifi_off" color="primary" text-color="white" />
        <span class="q-ml-sm">{{ content }}</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="okText == '' ? 'ok' : okText"
          color="primary"
          @click="ok == undefined ? null : ok()"
        />
        <q-btn
          flat
          :label="cancelText == '' ? 'cancel' : cancelText"
          @click="cancel == undefined ? null : cancel()"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "confirmVue",
  props: {
    content: String,
    title: String,
    okText: String,
    cancelText: String,
    ok: Function,
    cancel: Function,
  },

  setup() {
    return {};
  },
});
</script>
