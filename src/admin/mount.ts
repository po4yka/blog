import { createElement } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./App";

const root = document.getElementById("admin-root");
if (root) {
  createRoot(root).render(createElement(AdminApp));
}
