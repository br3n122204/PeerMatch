import { redirect } from "next/navigation";

export default function AdminUserManagementIndexPage() {
  redirect("/admin/usermanagement/allusers");
}
