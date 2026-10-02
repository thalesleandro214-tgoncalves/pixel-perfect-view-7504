import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function Gate({ role, children }: { role: "admin" | "auxiliar"; children: ReactNode }) {
  const auth = useAuth();
  if (auth.loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!auth.session) return <Navigate to="/" replace />;
  if (auth.role !== role) return <Navigate to={auth.role === "admin" ? "/admin" : "/app"} replace />;
  return <>{children}</>;
}
