import { Suspense } from "react";
import AdminLoginForm from "../components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="shell narrow">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
