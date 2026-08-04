import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationBar } from "@/components/location-bar";
import type { LocationBarData } from "@/lib/square/types";

const mockLocationData: LocationBarData = {
  cityState: "Seattle, WA",
  hoursDisplay: "Open today: 9 AM \u2013 9 PM",
  status: "open",
  statusText: "Open Now",
};

describe("LocationBar", () => {
  it("should render city and state", () => {
    render(<LocationBar locationData={mockLocationData} />);
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
  });

  it("should render hours display text", () => {
    render(<LocationBar locationData={mockLocationData} />);
    expect(
      screen.getByText("Open today: 9 AM \u2013 9 PM")
    ).toBeInTheDocument();
  });

  it("should render open status indicator", () => {
    render(<LocationBar locationData={mockLocationData} />);
    expect(screen.getByText("Open Now")).toBeInTheDocument();
  });

  it("should render closing-soon status indicator", () => {
    render(
      <LocationBar
        locationData={{ ...mockLocationData, status: "closing-soon", statusText: "Closing Soon" }}
      />
    );
    expect(screen.getByText("Closing Soon")).toBeInTheDocument();
  });

  it("should render closed status indicator", () => {
    render(
      <LocationBar
        locationData={{ ...mockLocationData, status: "closed", statusText: "Closed Now" }}
      />
    );
    expect(screen.getByText("Closed Now")).toBeInTheDocument();
  });

  it("should render closed-today status indicator", () => {
    render(
      <LocationBar
        locationData={{ ...mockLocationData, status: "closed-today", statusText: "Closed Today" }}
      />
    );
    expect(screen.getByText("Closed Today")).toBeInTheDocument();
  });

  it("should not render hoursDisplay when status is closed-today", () => {
    render(
      <LocationBar
        locationData={{ ...mockLocationData, status: "closed-today", statusText: "Closed Today", hoursDisplay: "Closed today" }}
      />
    );
    expect(
      screen.queryByText("Closed today")
    ).not.toBeInTheDocument();
  });

  it("should have accessible aria-label without hoursDisplay when closed-today", () => {
    render(
      <LocationBar
        locationData={{ ...mockLocationData, status: "closed-today", statusText: "Closed Today", hoursDisplay: "Closed today" }}
      />
    );
    const container = screen.getByLabelText(
      "Store location: Seattle, WA. Closed Today"
    );
    expect(container).toBeInTheDocument();
  });

  it("should return null when locationData is null", () => {
    const { container } = render(<LocationBar locationData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should have screen reader accessible aria-label", () => {
    render(<LocationBar locationData={mockLocationData} />);
    const container = screen.getByLabelText(
      "Store location: Seattle, WA. Open today: 9 AM – 9 PM. Open Now"
    );
    expect(container).toBeInTheDocument();
  });
});
