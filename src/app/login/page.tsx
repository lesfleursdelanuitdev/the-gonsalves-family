import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { LoginView } from "@/components/auth/LoginView";
import { decodeReturnToParam, sanitizePublicReturnPathExcludingLogin } from "@/lib/auth/public-return-path";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ returnTo?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const decoded = decodeReturnToParam(sp.returnTo);
  const safeReturnTo = sanitizePublicReturnPathExcludingLogin(decoded);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <LoginView safeReturnTo={safeReturnTo} />
    </div>
  );
}
