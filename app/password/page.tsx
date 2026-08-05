"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: value }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5">
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
          className="w-full rounded-lg border border-[#CDCDD8] px-4 py-3 text-sm"
          placeholder="Site password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold uppercase text-white hover:bg-orange-400"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
