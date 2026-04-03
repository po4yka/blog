import { createBrowserRouter } from "react-router";
import { lazy } from "react";

const AdminRoot = lazy(() =>
  import("./components/AdminRoot").then((m) => ({ default: m.AdminRoot }))
);
const AdminLayout = lazy(() =>
  import("./components/AdminLayout").then((m) => ({ default: m.AdminLayout }))
);
const AdminLogin = lazy(() =>
  import("./pages/AdminLogin").then((m) => ({ default: m.AdminLogin }))
);
const AdminSetup = lazy(() =>
  import("./pages/AdminSetup").then((m) => ({ default: m.AdminSetup }))
);
const AdminDashboard = lazy(() =>
  import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const AdminBlogList = lazy(() =>
  import("./pages/AdminBlogList").then((m) => ({ default: m.AdminBlogList }))
);
const AdminBlogEdit = lazy(() =>
  import("./pages/AdminBlogEdit").then((m) => ({ default: m.AdminBlogEdit }))
);
const AdminProjects = lazy(() =>
  import("./pages/AdminProjects").then((m) => ({ default: m.AdminProjects }))
);
const AdminExperience = lazy(() =>
  import("./pages/AdminExperience").then((m) => ({ default: m.AdminExperience }))
);
const AdminSettings = lazy(() =>
  import("./pages/AdminSettings").then((m) => ({ default: m.AdminSettings }))
);

export const router = createBrowserRouter([
  {
    path: "/admin",
    Component: AdminRoot,
    children: [
      { path: "login", Component: AdminLogin },
      { path: "setup", Component: AdminSetup },
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "blog", Component: AdminBlogList },
          { path: "blog/new", Component: AdminBlogEdit },
          { path: "blog/edit/:slug", Component: AdminBlogEdit },
          { path: "projects", Component: AdminProjects },
          { path: "experience", Component: AdminExperience },
          { path: "settings", Component: AdminSettings },
        ],
      },
    ],
  },
]);
