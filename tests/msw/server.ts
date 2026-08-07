import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server for integration tests.
 *
 * Mocks network requests at the fetch boundary. Active by default in
 * vitest-setup.ts so any test that fetches `/api/catalog/categories`
 * is intercepted. Use `server.use(...)` to override per test.
 */
export const server = setupServer(...handlers);