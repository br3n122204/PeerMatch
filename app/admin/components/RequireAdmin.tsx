"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, role } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "checking") return;
    if (status === "guest") {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role !== "admin") {
      router.replace("/admin/unauthorized");
    }
  }, [status, role, router, pathname]);

  if (status === "checking" || status === "guest" || role !== "admin") {
    return (
      <div className="admin-auth-check">
        <p className="admin-auth-check__text">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
