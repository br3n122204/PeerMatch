"use client";

import AdminLayout, { AdminLayoutStatsProvider } from "../components/AdminLayout";
import RequireAdmin from "../components/RequireAdmin";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminLayoutStatsProvider>
        <AdminLayout>{children}</AdminLayout>
      </AdminLayoutStatsProvider>
    </RequireAdmin>
  );
}
