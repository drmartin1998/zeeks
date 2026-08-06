import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuestLoyaltyNotification } from "@/components/checkout/guest-loyalty-notification";

describe("GuestLoyaltyNotification", () => {
  it("should render notification when guest, cart non-empty, and loyalty configured", () => {
    render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    expect(
      screen.getByRole("status", { name: /loyalty program notification/i })
    ).toBeInTheDocument();
  });

  it("should return null when isGuest is false", () => {
    const { container } = render(
      <GuestLoyaltyNotification
        isGuest={false}
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should return null when cart is empty", () => {
    const { container } = render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty={false}
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should return null when loyalty is not configured", () => {
    const { container } = render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display Register and Sign In links with return_to parameter", () => {
    render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    const registerLink = screen.getByRole("link", { name: /register/i });
    const signInLink = screen.getByRole("link", { name: /sign in/i });

    expect(registerLink).toHaveAttribute(
      "href",
      "/sign-up?return_to=%2Fcheckout"
    );
    expect(signInLink).toHaveAttribute(
      "href",
      "/sign-in?return_to=%2Fcheckout"
    );
  });

  it("should display loyalty message text", () => {
    render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    expect(
      screen.getByText(/earn points and redeem rewards/i)
    ).toBeInTheDocument();
  });

  it("should have role='status' for screen reader accessibility", () => {
    render(
      <GuestLoyaltyNotification
        isGuest
        cartIsNonEmpty
        checkoutPath="/checkout"
        isLoyaltyConfigured
      />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
