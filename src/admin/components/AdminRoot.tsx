import { Suspense } from "react";
import { Outlet } from "react-router";

export function AdminRoot() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <span
            className="text-muted-foreground/80"
            style={{ fontSize: "0.75rem" }}
          >
            loading...
          </span>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}