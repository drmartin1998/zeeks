import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { LocalStoreHub } from "@/components/local-store-hub/local-store-hub";
import { events } from "@/components/local-store-hub/events-data";

describe("LocalStoreHub", () => {
  it("renders the section header with heading, subtitle, and VIEW ALL EVENTS link", () => {
    render(<LocalStoreHub />);

    expect(
      screen.getByRole("heading", { name: /local store hub/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upcoming events, tournaments, and community nights at your local Zeeks store.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view all events/i }),
    ).toHaveAttribute("href", "/events");
  });

  it("renders four event cards with category, date/time, title, and description", () => {
    render(<LocalStoreHub />);

    expect(events).toHaveLength(4);

    for (const event of events) {
      expect(screen.getByText(event.title)).toBeInTheDocument();
      expect(screen.getByText(event.dateTime)).toBeInTheDocument();
      expect(screen.getByText(event.category)).toBeInTheDocument();
      expect(screen.getByText(event.description)).toBeInTheDocument();
    }
  });

  it("renders the VIEW ALL EVENTS link to the events destination", () => {
    render(<LocalStoreHub />);

    expect(
      screen.getByRole("link", { name: /view all events/i }),
    ).toHaveAttribute("href", "/events");
  });

  it("renders a neutral header-only state when there are no events", async () => {
    vi.resetModules();
    vi.doMock("@/components/local-store-hub/events-data", () => ({
      events: [],
    }));

    const mod = await import("@/components/local-store-hub/local-store-hub");
    const EmptyStoreHub = mod.LocalStoreHub;

    const { container } = render(<EmptyStoreHub />);

    expect(
      screen.getByRole("heading", { name: /local store hub/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });
});