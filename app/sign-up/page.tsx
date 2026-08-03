import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export default async function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex flex-1 items-center justify-center overflow-x-hidden py-16">
        <Suspense>
          <AuthGuard>
            <SignUpForm />
          </AuthGuard>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
