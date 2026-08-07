import Link from "next/link";

interface BreadcrumbSegment {
  name: string;
  slug: string;
}

interface BreadcrumbProps {
  /**
   * Full category path, ordered from the top-level category down to the
   * product's deepest subcategory (e.g. [Miniatures, Games Workshop, Warhammer 40K]).
   */
  categoryPath: BreadcrumbSegment[];
  productTitle: string;
}

const UNCATEGORIZED_SLUG = "uncategorized";

export function Breadcrumb({ categoryPath, productTitle }: BreadcrumbProps) {
  const topLevel = categoryPath[0];
  // If there is no resolvable real category (uncategorized fallback), render it
  // as plain text rather than linking to a route that would 404.
  const isUncategorized =
    !topLevel || topLevel.slug === UNCATEGORIZED_SLUG;

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <li>
          <Link href="/" className="hover:text-zeeks-purple transition-colors">
            Home
          </Link>
        </li>
        {categoryPath.map((segment, index) => {
          const isTopLevel = index === 0;

          // The top-level segment links to the category listing route.
          // Every subcategory segment (index > 0) links to the top-level page
          // with a sub filter (e.g. /categories/miniatures?sub=games-workshop)
          // when the value is a real category; otherwise render as plain text.
          let href: string | null = null;
          if (isTopLevel && !isUncategorized) {
            href = `/categories/${segment.slug}`;
          } else if (!isTopLevel && topLevel && !isUncategorized) {
            href = `/categories/${topLevel.slug}?sub=${segment.slug}`;
          }

          return (
            <li
              key={segment.slug}
              className="flex flex-wrap items-center gap-1"
            >
              <span aria-hidden="true" className="select-none">
                /
              </span>
              {href !== null ? (
                <Link
                  href={href}
                  className="hover:text-zeeks-purple transition-colors"
                >
                  {segment.name}
                </Link>
              ) : (
                <span className="text-gray-500">{segment.name}</span>
              )}
            </li>
          );
        })}
        <li aria-hidden="true" className="select-none">
          /
        </li>
        <li className="font-medium text-gray-900">{productTitle}</li>
      </ol>
    </nav>
  );
}
