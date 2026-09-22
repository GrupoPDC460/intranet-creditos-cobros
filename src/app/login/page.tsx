import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Ingresar" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = typeof searchParams.next === "string" && searchParams.next !== "/admin" ? searchParams.next : "/";
  return <LoginForm next={next} />;
}
