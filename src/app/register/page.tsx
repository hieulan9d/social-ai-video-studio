import { AuthScreen } from "@/components/auth/auth-screen";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <AuthScreen next={next} error={error} mode="register" />;
}
