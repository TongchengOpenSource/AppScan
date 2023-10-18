const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/ApplicationPage.vue"),
        meta: { title: "应用列表" },
      },
      {
        path: "mark",
        name: "mark",
        component: () => import("pages/detection/page/Step.vue"),
        meta: { title: "打标列表" },
      },
    ],
  },
  {
    path: "/record",
    meta: { title: "历史记录" },
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        meta: { title: "历史记录" },
        component: () => import("pages/history/List.vue"),
      },
      {
        path: "major",
        meta: { title: "专业检测" },
        component: () => import("pages/history/page/Major.vue"),
      },
      {
        path: "result",
        meta: { title: "检测结果" },
        component: () => import("pages/history/page/Result.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
