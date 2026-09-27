import { redirect } from "next/navigation";

export default function RegisterRedirect() {
  redirect("/login?notice=staff-only");
}
