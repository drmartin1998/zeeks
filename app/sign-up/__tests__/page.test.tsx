import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseSignUp = vi.fn();
const mockUseRouter = vi.fn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignUp: () => mockUseSignUp(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter(),
  useSearchParams: () => new URLSearchParams(),
}));

import { SignUpForm } from "@/components/auth/sign-up-form";

describe("SignUpForm returnTo", () => {
  beforeEach(() => {
    mockUseSignUp.mockReturnValue({ isLoaded: false, signUp: null, setActive: null });
    mockUseRouter.mockReturnValue({ push: vi.fn() });
  });

  it("should render with default returnTo '/' when not provided", () => {
    render(<SignUpForm />);

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  it("should render with custom returnTo '/checkout' when provided", () => {
    render(<SignUpForm returnTo="/checkout" />);

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });
});
