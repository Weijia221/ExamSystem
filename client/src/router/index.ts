import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/role-select",
    name: "RoleSelect",
    component: () => import("../views/RoleSelect.vue"),
  },
  {
    path: "/teacher/dashboard",
    name: "TeacherDashboard",
    component: () => import("../views/TeacherDashboard.vue"),
  },
  {
    path: "/student/dashboard",
    name: "StudentDashboard",
    component: () => import("../views/StudentDashboard.vue"),
  },
  {
    path: "/question-bank",
    name: "QuestionBank",
    component: () => import("../views/QuestionBank.vue"),
  },
  {
    path: "/exam-creation",
    name: "ExamCreation",
    component: () => import("../views/ExamCreation.vue"),
  },
  {
    path: "/student/exam",
    name: "StudentExam",
    component: () => import("../views/StudentExam.vue"),
  },
  {
    path: "/teacher/scores",
    name: "TeacherScores",
    component: () => import("../views/TeacherScores.vue"),
  },
  {
    path: "/student/scores",
    name: "StudentScores",
    component: () => import("../views/StudentScores.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
