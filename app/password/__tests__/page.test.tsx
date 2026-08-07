import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation useSearchParams for returnTo
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock global fetch for the password API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import PasswordPage from "@/app/password/page";

describe("PasswordPage new layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set("returnTo", "/shop/miniatures");
  });

  it("should render the gate layout (headline, form, footer)", () => {
    render(<PasswordPage />);

    // Headline
    expect(screen.getByText(/SOMETHING EPIC/i)).toBeInTheDocument();
    expect(screen.getByText(/IS COMING/i)).toBeInTheDocument();
    // Subhead
    expect(screen.getByText(/Your new home for TCGs/i)).toBeInTheDocument();
    // Password input
    expect(
      screen.getByLabelText(/secret passphrase/i)
    ).toBeInTheDocument();
    // Button
    expect(
      screen.getByRole("button", { name: /unlock early access/i })
    ).toBeInTheDocument();
    // Footer launch text
    expect(screen.getByText("COMING Q3 2026")).toBeInTheDocument();
    // Brand logo is visible
    expect(screen.getByAltText("Zeeks")).toBeInTheDocument();
    // Social links: Facebook + Instagram only (no Twitter/YouTube)
    expect(screen.getByRole("link", { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /twitter/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /youtube/i })).not.toBeInTheDocument();
  });
});

describe("PasswordPage validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set("returnTo", "/shop/miniatures");
  });

  it("should show an error for an incorrect password", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid password" }),
    });

    render(<PasswordPage />);

    await user.type(screen.getByLabelText(/secret passphrase/i), "wrong");
    await user.click(screen.getByRole("button", { name: /unlock early access/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/incorrect password/i);
    });
    // Access not granted — fetch called with the wrong password
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/password",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should redirect to returnTo on a correct password", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Stub window.location.href
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
    });

    render(<PasswordPage />);

    await user.type(screen.getByLabelText(/secret passphrase/i), "correct");
    await user.click(screen.getByRole("button", { name: /unlock early access/i }));

    await waitFor(() => {
      expect(window.location.href).toBe("/shop/miniatures");
    });
  });
});