import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ErrorPage } from "@/components/error-page";
import { getNavCategories } from "@/lib/data/categories";
import type { NavCategory } from "@/lib/square/types";

export default async function NotFound() {
  let navCategories: NavCategory[] = [];
  try {
    navCategories = await getNavCategories();
  } catch {
    // Use empty categories if fetch fails
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar categories={navCategories} />
      <ErrorPage />
      <Footer />
    </div>
  );
}
