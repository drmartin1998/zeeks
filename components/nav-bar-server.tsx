import { getNavCategories } from "@/lib/data/categories";
import { NavBar } from "@/components/nav-bar";

/**
 * Server Component wrapper for the NavBar.
 *
 * Fetches category data from Square on the server and
 * passes it to the client-side NavBar component.
 */
export async function NavBarServer() {
  const categories = await getNavCategories();
  return <NavBar categories={categories} />;
}
