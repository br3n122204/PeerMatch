"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminUnauthorizedContent() {
  const { status, user, role, logout } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "checking") return;
    if (status === "guest") {
      router.replace("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "checking") return;
    if (role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [status, role, router]);

  if (status === "checking" || status === "guest") {
    return (
      <div className="shell">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="shell">
        <p className="muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <h1>PeerMatch Admin</h1>
      <p className="warn">
        Signed in as <strong>{user?.email}</strong>, but this area is only for administrators.
      </p>
      <p className="muted">
        API routes under <code>/api/admin</code> also return 403 for non-admins.
      </p>
      <div className="row" style={{ marginTop: "1rem" }}>
        <button type="button" className="primary" onClick={() => void logout()}>
          Sign out
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            void logout().then(() => router.replace("/admin/login"));
          }}
        >
          Switch account
        </button>
      </div>
    </div>
  );
}
