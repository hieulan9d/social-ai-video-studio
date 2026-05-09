import { AuthScreen } from "@/components/auth/auth-screen";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string }>;
}) {
  const { next, error, mode } = await searchParams;

  return (
    <AuthScreen
      next={next}
      error={error}
      mode={mode === "register" ? "register" : "login"}
    />
  );
}
