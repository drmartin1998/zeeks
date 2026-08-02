import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileCard } from "@/components/account/profile-card";
import type { CustomerProfile } from "@/lib/square/types";

function createProfile(overrides: Partial<CustomerProfile> = {}): CustomerProfile {
  return {
    id: "CUST001",
    givenName: "Jane",
    familyName: "Doe",
    emailAddress: "jane@example.com",
    phoneNumber: "+15551234567",
    ...overrides,
  };
}

describe("ProfileCard", () => {
  it("should display customer name and email", () => {
    const profile = createProfile();
    render(<ProfileCard profile={profile} error={null} />);

    expect(screen.getByText("Account Info")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("should display only email when name fields are missing", () => {
    const profile = createProfile({ givenName: undefined, familyName: undefined });
    render(<ProfileCard profile={profile} error={null} />);

    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText(/\u2014/)).toBeInTheDocument();
  });

  it("should display only given name when family name is missing", () => {
    const profile = createProfile({ familyName: undefined });
    render(<ProfileCard profile={profile} error={null} />);

    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.queryByText("Doe")).not.toBeInTheDocument();
  });

  it("should display error state when API fails", () => {
    render(<ProfileCard profile={null} error="Profile API down" />);

    expect(
      screen.getByText("Unable to load profile information"),
    ).toBeInTheDocument();
  });

  it("should render labels for name and email fields", () => {
    const profile = createProfile();
    render(<ProfileCard profile={profile} error={null} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });
});
