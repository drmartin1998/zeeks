"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export function AuthDropdown() {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
    }
    setOpen(!open);
  }

  const trigger = (
    <button
      ref={triggerRef}
      onClick={handleToggle}
      aria-label="Account menu"
      aria-expanded={open}
      className="flex items-center"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-white/70 hover:text-white transition-colors cursor-pointer"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </button>
  );

  const menu = open && mounted
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-44 -translate-x-full rounded-xl border border-border bg-card py-1 shadow-lg"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <Link
            href="/sign-in"
            onClick={close}
            className="block px-4 py-2.5 text-sm text-primary hover:bg-muted transition-colors"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            onClick={close}
            className="block px-4 py-2.5 text-sm text-primary hover:bg-muted transition-colors"
          >
            Sign Up
          </Link>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger}
      {menu}
    </>
  );
}
