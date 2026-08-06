import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthGuard } from "@/components/auth/auth-guard";

const ALLOWED_RETURN_PATHS = ["/checkout", "/cart", "/account"];

interface Props {
  searchParams: Promise<{ return_to?: string }>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const { return_to } = await searchParams;
  const isAllowedPath =
    return_to && ALLOWED_RETURN_PATHS.some((p) => return_to.startsWith(p));
  const safeReturnTo = isAllowedPath ? return_to : "/";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex flex-1 items-center justify-center overflow-x-hidden py-16">
        <Suspense>
          <AuthGuard>
            <SignUpForm returnTo={safeReturnTo} />
          </AuthGuard>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
