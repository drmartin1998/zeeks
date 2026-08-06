import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthGuard } from "@/components/auth/auth-guard";

const ALLOWED_RETURN_PATHS = ["/checkout", "/cart", "/account"];

interface Props {
  searchParams: Promise<{ return_to?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { return_to } = await searchParams;
  const isAllowedPath =
    return_to && ALLOWED_RETURN_PATHS.some((p) => return_to.startsWith(p));
  const safeReturnTo = isAllowedPath ? return_to : "/";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex flex-1 items-center justify-center overflow-x-hidden py-16">
        <Suspense>
          <AuthGuard>
            <SignInForm returnTo={safeReturnTo} />
          </AuthGuard>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
