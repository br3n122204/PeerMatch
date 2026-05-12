import "./admin.css";
import { AdminAuthProvider } from "./context/AdminAuthContext";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
