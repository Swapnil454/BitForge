import { redirect } from "next/navigation";

export default function RootRedirectPage() {
  // Use a permanent redirect since the landing page has formally moved to /home
  redirect("/home");
}
