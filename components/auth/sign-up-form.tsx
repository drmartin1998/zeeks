"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  verifyPassword?: string;
}

const PHONE_REGEX = /^\+\d{7,15}$/;

export function SignUpForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!email.trim()) errs.email = "Email is required";
    if (!phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(phone.trim())) {
      errs.phone = "Enter phone in E.164 format (e.g. +15551234567)";
    }
    if (!password) errs.password = "Password is required";
    if (password && password !== verifyPassword) {
      errs.verifyPassword = "Passwords do not match";
    }
    if (!verifyPassword) errs.verifyPassword = "Please verify your password";
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

    if (!isLoaded || !signUp || !setActive) return;

    setLoading(true);
    try {
      const result = await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        phoneNumber: phone.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.back();
        return;
      }

      if (result.status === "missing_requirements") {
        await signUp.prepareVerification({ strategy: "email_code" });
        setVerificationStep(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create account";
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

    if (!isLoaded || !signUp || !setActive) return;

    setLoading(true);
    try {
      const result = await signUp.attemptVerification({
        strategy: "email_code",
        code: verificationCode.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.back();
        return;
      }

      setApiError("Verification failed. Please check your code and try again.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!signUp) return;

    setApiError(null);
    setResendSuccess(false);
    setLoading(true);
    try {
      await signUp.prepareVerification({ strategy: "email_code" });
      setResendSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  if (verificationStep) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <h1 className="font-heading text-2xl font-extrabold text-primary mb-2">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          We sent a verification code to <strong>{email}</strong>. Enter it below
          to complete your sign-up.
        </p>

        {apiError && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            A new verification code has been sent to your email.
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="verification-code"
              className="text-sm font-medium text-primary"
            >
              Verification code
            </label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Verify Code"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleResendCode}
            className="w-full"
          >
            Resend code
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <h1 className="font-heading text-2xl font-extrabold text-primary mb-2">
        Create your account
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Join Zeeks and start earning rewards
      </p>

      {apiError && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="first-name"
              className="text-sm font-medium text-primary"
            >
              First name
            </label>
            <Input
              id="first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="last-name"
              className="text-sm font-medium text-primary"
            >
              Last name
            </label>
            <Input
              id="last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-primary">
            Email
          </label>
          <Input
            id="signup-email"
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
          <label htmlFor="phone" className="text-sm font-medium text-primary">
            Phone number
          </label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="signup-password"
            className="text-sm font-medium text-primary"
          >
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="verify-password"
            className="text-sm font-medium text-primary"
          >
            Verify password
          </label>
          <Input
            id="verify-password"
            type="password"
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
          {errors.verifyPassword && (
            <p className="text-xs text-destructive">
              {errors.verifyPassword}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-[#7B4FA2] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
