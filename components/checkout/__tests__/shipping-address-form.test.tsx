import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShippingAddressForm } from "@/components/checkout/shipping-address-form";

describe("ShippingAddressForm", () => {
  const onChange = vi.fn();

  it("should render the address fields", () => {
    render(<ShippingAddressForm onChange={onChange} />);
    expect(screen.getByText("Recipient Name")).toBeInTheDocument();
    expect(screen.getByText("Street Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("City")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("State")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ZIP")).toBeInTheDocument();
  });

  it("should offer a same-as-billing option", () => {
    render(<ShippingAddressForm onChange={onChange} />);
    expect(screen.getByText("Same as billing address")).toBeInTheDocument();
  });

  it("should report the address via onChange as the user types", () => {
    render(<ShippingAddressForm onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("City"), {
      target: { value: "Peoria" },
    });
    expect(onChange).toHaveBeenCalled();
  });
});