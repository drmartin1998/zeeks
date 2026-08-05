"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PasswordForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });

      if (res.ok) {
        window.location.href = returnTo;
      } else {
        setError("Incorrect password");
        setLoading(false);
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-center font-heading text-2xl font-black text-text-primary">
        Enter Password
      </h1>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        autoFocus
        className="w-full rounded-lg border border-[#CDCDD8] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-orange-500 focus:outline-none"
        placeholder="Site password"
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold uppercase text-white hover:bg-orange-400 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>
    </form>
  );
}

export default function PasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5">
      <Suspense fallback={<div className="animate-pulse h-10 w-40 rounded bg-gray-200" />}>
        <PasswordForm />
      </Suspense>
    </div>
  );
}
