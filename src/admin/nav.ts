import { LayoutDashboard, FileText, FolderKanban, Briefcase, Activity, Settings } from "lucide-react";

/** Admin sections: number for the `NN / LABEL` headers, key for the `g <key>` shortcut. */
export const adminNav = [
  { number: "01", label: "Dashboard", path: "/admin", key: "d", icon: LayoutDashboard },
  { number: "02", label: "Blog Posts", path: "/admin/blog", key: "b", icon: FileText },
  { number: "03", label: "Projects", path: "/admin/projects", key: "p", icon: FolderKanban },
  { number: "04", label: "Experience", path: "/admin/experience", key: "e", icon: Briefcase },
  { number: "05", label: "Telemetry", path: "/admin/telemetry", key: "t", icon: Activity },
  { number: "06", label: "Settings", path: "/admin/settings", key: "s", icon: Settings },
] as const;
