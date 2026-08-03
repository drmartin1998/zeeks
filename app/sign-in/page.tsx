import { Suspense } from "react";
import { NavBarServer } from "@/components/nav-bar-server";
import { Footer } from "@/components/footer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export default async function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBarServer />
      <main className="flex flex-1 items-center justify-center overflow-x-hidden py-16">
        <Suspense>
          <AuthGuard>
            <SignInForm />
          </AuthGuard>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
