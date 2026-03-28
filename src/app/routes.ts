import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { lazy } from "react";

// Eagerly load the homepage since it's the primary entry point
import { Home } from "./pages/Home";

// Lazy-load all other pages — they are only fetched when navigated to
const Blog = lazy(() => import("./pages/Blog").then((m) => ({ default: m.Blog })));
const BlogPost = lazy(() => import("./pages/BlogPost").then((m) => ({ default: m.BlogPost })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const ExperiencePage = lazy(() => import("./pages/ExperiencePage").then((m) => ({ default: m.ExperiencePage })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

// Admin pages — completely separate bundle
const AdminRoot = lazy(() => import("./components/admin/AdminRoot").then((m) => ({ default: m.AdminRoot })));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin").then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminBlogList = lazy(() => import("./pages/admin/AdminBlogList").then((m) => ({ default: m.AdminBlogList })));
const AdminBlogEdit = lazy(() => import("./pages/admin/AdminBlogEdit").then((m) => ({ default: m.AdminBlogEdit })));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects").then((m) => ({ default: m.AdminProjects })));
const AdminExperience = lazy(() => import("./pages/admin/AdminExperience").then((m) => ({ default: m.AdminExperience })));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then((m) => ({ default: m.AdminSettings })));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "blog", Component: Blog },
      { path: "blog/:slug", Component: BlogPost },
      { path: "projects", Component: ProjectsPage },
      { path: "experience", Component: ExperiencePage },
      { path: "settings", Component: Settings },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin",
    Component: AdminRoot,
    children: [
      { path: "login", Component: AdminLogin },
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