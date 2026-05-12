import { redirect } from "next/navigation";

export default function AdminTasksIndexPage() {
  redirect("/admin/tasks/pending");
}
