import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseSignIn = vi.fn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => mockUseSignIn(),
}));

import { SignInForm } from "@/components/auth/sign-in-form";

describe("SignInForm returnTo", () => {
  beforeEach(() => {
    mockUseSignIn.mockReturnValue({ isLoaded: false, signIn: null, setActive: null });
  });

  it("should render with default returnTo '/' when not provided", () => {
    render(<SignInForm />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it("should render with custom returnTo '/checkout' when provided", () => {
    render(<SignInForm returnTo="/checkout" />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});
