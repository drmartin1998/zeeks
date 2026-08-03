import React from "react";
import { vi } from "vitest";

/**
 * Mock Clerk @clerk/nextjs components for integration testing.
 *
 * Usage in tests:
 *   import { setupClerkMock } from "./__mocks__/clerk";
 *   setupClerkMock({ signedIn: false }); // or { signedIn: true }
 *
 * The mock provides:
 * - ClerkProvider: pass-through wrapper
 * - SignInButton: renders a button with data-clerk-sign-in attribute
 * - UserButton: renders a button with data-clerk-user-button attribute
 * - Show: conditionally renders children based on auth state
 */

export interface ClerkMockConfig {
  signedIn: boolean;
  user?: {
    id: string;
    email: string;
    imageUrl?: string;
    fullName?: string;
  };
}

let mockConfig: ClerkMockConfig = { signedIn: false };

export function setClerkMockConfig(config: ClerkMockConfig): void {
  mockConfig = config;
}

export function getClerkMockConfig(): ClerkMockConfig {
  return { ...mockConfig };
}

// React component mocks
export const ClerkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return React.createElement(React.Fragment, null, children);
};

export const SignInButton: React.FC<{
  children?: React.ReactNode;
  mode?: string;
}> = ({ children, mode }) => {
  return React.createElement(
    "button",
    {
      "data-clerk-sign-in": "",
      "data-mode": mode ?? "redirect",
      "aria-label": "User account",
    },
    children,
  );
};

export const UserButton: React.FC = () => {
  if (mockConfig.user) {
    return React.createElement(
      "button",
      {
        "data-clerk-user-button": "",
        "aria-label": `User: ${mockConfig.user.email}`,
      },
      mockConfig.user.email,
    );
  }
  return React.createElement("button", {
    "data-clerk-user-button": "",
    "aria-label": "User account",
  });
};

export const Show: React.FC<{
  children: React.ReactNode;
  when: string;
}> = ({ children, when }) => {
  const shouldShow =
    (when === "signed-in" && mockConfig.signedIn) ||
    (when === "signed-out" && !mockConfig.signedIn);
  return shouldShow
    ? React.createElement(React.Fragment, null, children)
    : null;
};

const mockSignOut = vi.fn();
export function getMockSignOut() { return mockSignOut; }

export const useUser = () => ({
  user: mockConfig.signedIn && mockConfig.user ? {
    id: mockConfig.user.id,
    fullName: mockConfig.user.fullName ?? null,
    primaryEmailAddress: mockConfig.user.email ? { emailAddress: mockConfig.user.email } : null,
  } : null,
  isLoaded: true,
});

export const useClerk = () => ({
  signOut: mockSignOut,
});