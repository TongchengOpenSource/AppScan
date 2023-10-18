import { defineStore } from "pinia";

export const useFridaHelpStore = defineStore("frida-helper", {
  state: () => ({
    port: 0,
    running: false,
  }),
  getters: {
    baseUrl: (state) => `http://127.0.0.1:${state.port}/api/v1`,
  },
  actions: {
    setPort (port) {
      this.port = port;
    },
    setRunning (running) {
      this.running = running;
    },
  },
});
