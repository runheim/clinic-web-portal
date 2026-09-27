import { redirect } from "next/navigation";

export default function SignupRedirect() {
  redirect("/login?notice=staff-only");
}
