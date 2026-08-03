"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function SignInForm() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!isLoaded || !signIn || !setActive) return;

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.back();
        return;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <h1 className="font-heading text-2xl font-extrabold text-primary mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sign in to your Zeeks account
      </p>

      {apiError && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-primary">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-primary"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-[#7B4FA2] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
