import "@testing-library/jest-dom/vitest";

// Channel filter config for tests
process.env.SQUARE_CHANNEL_ID = "TEST_CHANNEL";

// Required env vars for lib/env.ts validation (imported transitively via client.ts)
process.env.SQUARE_ACCESS_TOKEN = "test_square_access_token";
process.env.SQUARE_LOCATION_ID = "TEST_LOCATION";
process.env.SQUARE_APPLICATION_ID = "test_square_app_id";
process.env.CLERK_SECRET_KEY = "test_clerk_secret_key";

// JSDOM stubs for browser APIs not implemented in jsdom
window.scrollTo = () => {};

// matchMedia stub (used by responsive components like NavBar for
// desktop/mobile detection). Defaults to desktop (matches min-width queries)
// unless a test overrides it.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("1024px"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
