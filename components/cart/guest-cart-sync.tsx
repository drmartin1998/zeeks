"use client";

import { useEffect } from "react";
import { clearGuestCartCookie } from "@/app/cart/actions";

interface GuestCartSyncProps {
  /**
   * Whether a guest cart cookie existed on this render and should be cleared.
   * The guest cookie must be deleted in a Server Action (not during the Server
   * Component render), so this tiny client component defers the deletion until
   * after render by invoking `clearGuestCartCookie` on mount.
   */
  active: boolean;
}

/**
 * Best-effort cleanup that removes the guest cart cookie once the guest cart
 * has been merged into an authenticated customer's cart (or detected as
 * invalid) at the point of rendering the cart page. Renders nothing.
 *
 * Deletion is idempotent, so React StrictMode double-mounting in development
 * (or an already-removed cookie) is harmless.
 */
export function GuestCartSync({ active }: GuestCartSyncProps) {
  useEffect(() => {
    if (!active) return;
    void clearGuestCartCookie();
  }, [active]);

  return null;
}
