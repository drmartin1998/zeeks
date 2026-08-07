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
    <div className="flex w-full max-w-[640px] flex-col items-center gap-10 px-6">
      {/* Teaser copy */}
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center font-heading text-5xl font-extrabold leading-tight tracking-tight text-white md:text-[56px]">
          SOMETHING EPIC
          <br />
          IS COMING
        </h1>
        <p className="max-w-[640px] text-center text-base leading-relaxed text-[#9090A8]">
          Your new home for TCGs, comics, board games, RPGs, and miniatures.
          <br />
          Enter the password to get early access.
        </p>
      </div>

      {/* Form area */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[360px] flex-col items-center gap-4"
      >
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoFocus
          aria-label="Enter the secret passphrase"
          placeholder="Enter the secret passphrase..."
          className="w-full rounded-lg border border-[#272738] bg-[#15131B] px-4 py-3 text-sm text-white placeholder:text-[#9090A8] focus:border-orange-500 focus:outline-none"
        />
        {error && (
          <p className="text-center text-sm text-red-400" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#E8950E] px-6 py-3.5 text-sm font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#C47F10] disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Unlock Early Access"}
        </button>
        <p className="opacity-60 text-xs text-[#9090A8]">
          Hint: Check your email or ask us on social
        </p>
      </form>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#120E29] px-5 pb-12 pt-10">
      {/* Central hearth glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#581C87] opacity-40 blur-[150px]"
      />
      {/* Top soft ambient */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[1000px] -translate-x-1/2 rounded-full bg-[#7828B4] opacity-20 blur-[120px]"
      />
      {/* Ember stars */}
      <div aria-hidden className="absolute left-[30%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#B482FF] blur-[2px]" />
      <div aria-hidden className="absolute right-[28%] top-[26%] h-2 w-2 rounded-full bg-[#B482FF] opacity-70 blur-[3px]" />
      <div aria-hidden className="absolute left-[24%] bottom-[30%] h-[5px] w-[5px] rounded-full bg-[#B482FF] opacity-50" />
      <div aria-hidden className="absolute right-[22%] bottom-[36%] h-1.5 w-1.5 rounded-full bg-[#B482FF] opacity-60 blur-[2px]" />

      {/* Brand logo header */}
      <header className="relative z-10 flex justify-center pt-4">
        <img
          src="/images/logo.png"
          alt="Zeeks"
          className="h-[90px] w-auto object-contain"
        />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex w-full flex-1 items-center justify-center">
        <Suspense
          fallback={<div className="h-10 w-40 animate-pulse rounded bg-white/10" />}
        >
          <PasswordForm />
        </Suspense>
      </main>

      {/* Footer: launch info + socials */}
      <footer className="relative z-10 flex flex-col items-center gap-5 pb-8">
        <p className="text-sm font-medium text-[#F5A623]">COMING Q3 2026</p>
        <div className="flex items-center gap-4">
          {[
            {
              label: "Facebook",
              path: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z",
            },
            {
              label: "Instagram",
              path: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.2 5.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
            },
          ].map(({ label, path }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#272738] bg-[#15131B] text-white/80 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                <path d={path} />
              </svg>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}