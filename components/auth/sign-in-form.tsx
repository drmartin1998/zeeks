"use client";

import { useState, type FormEvent } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FieldErrors {
  email?: string;
  password?: string;
}

interface SignInFormProps {
  returnTo?: string;
}

export function SignInForm({ returnTo = "/" }: SignInFormProps) {
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification step state (e.g. needs_client_trust / needs_second_factor)
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

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
        window.location.href = returnTo;
        return;
      }

      if (result.status === "needs_second_factor" || result.status === "needs_client_trust") {
        const secondFactors = (result as unknown as Record<string, unknown>).supportedSecondFactors as Array<Record<string, unknown>> | undefined;
        const emailFactor = secondFactors?.find((f) => f.strategy === "email_code");

        if (emailFactor && typeof emailFactor.emailAddressId === "string") {
          await (signIn as unknown as { prepareSecondFactor: (opts: Record<string, unknown>) => Promise<unknown> }).prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setMaskedEmail((emailFactor.safeIdentifier as string) || email.trim());
          setVerifying(true);
          return;
        }
      }

      if (result.status === "needs_first_factor") {
        const firstFactors = (result as unknown as Record<string, unknown>).supportedFirstFactors as Array<Record<string, unknown>> | undefined;
        const emailFactor = firstFactors?.find((f) => f.strategy === "email_code");

        if (emailFactor && typeof emailFactor.emailAddressId === "string") {
          await (signIn as unknown as { prepareFirstFactor: (opts: Record<string, unknown>) => Promise<unknown> }).prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setMaskedEmail((emailFactor.safeIdentifier as string) || email.trim());
          setVerifying(true);
          return;
        }
      }

      setApiError(`Verification required (${result.status}). Please check your email or contact support.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!verificationCode.trim()) {
      setApiError("Please enter the verification code");
      return;
    }

    if (!isLoaded || !signIn || !setActive) return;

    setLoading(true);
    try {
      const status = signIn.status as string;
      let result;

      if (status === "needs_second_factor" || status === "needs_client_trust") {
        result = await (signIn as unknown as { attemptSecondFactor: (opts: Record<string, unknown>) => Promise<{ status: string; createdSessionId?: string }> }).attemptSecondFactor({
          strategy: "email_code",
          code: verificationCode.trim(),
        });
      } else {
        result = await (signIn as unknown as { attemptFirstFactor: (opts: Record<string, unknown>) => Promise<{ status: string; createdSessionId?: string }> }).attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode.trim(),
        });
      }

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        window.location.href = returnTo;
        return;
      }

      setApiError(`Verification status: ${result.status}. Please check the code and try again.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid verification code";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <h1 className="font-heading text-2xl font-extrabold text-primary mb-2">
          Verification Required
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          We sent a verification code to{" "}
          <span className="font-semibold text-primary">{maskedEmail || email}</span>.
          Please enter it below to complete sign-in.
        </p>

        {apiError && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-primary">
              Verification Code
            </label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Verify & Sign In"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setVerifying(false);
              setApiError(null);
            }}
            className="text-xs text-muted-foreground hover:underline text-center mt-2"
          >
            Back to Sign In
          </button>
        </form>
      </div>
    );
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
