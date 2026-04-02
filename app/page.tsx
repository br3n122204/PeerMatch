import { redirect } from "next/navigation";

export default function HomeRedirect() {
  // Keep the visible landing page at `/home`, but preserve legacy `/` access.
  redirect("/home");
}
