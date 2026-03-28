import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span
        className="font-mono text-muted-foreground/40 animate-pulse"
        style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}
      >
        Loading...
      </span>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
