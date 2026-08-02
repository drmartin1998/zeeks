import "@testing-library/jest-dom/vitest";

// Channel filter config for tests
process.env.SQUARE_CHANNEL_ID = "TEST_CHANNEL";

// JSDOM stubs for browser APIs not implemented in jsdom
window.scrollTo = () => {};
