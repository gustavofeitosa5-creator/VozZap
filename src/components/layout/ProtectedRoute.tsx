import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useApp } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
