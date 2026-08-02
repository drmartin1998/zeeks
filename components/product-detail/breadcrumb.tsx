import Link from "next/link";

interface BreadcrumbSegment {
  name: string;
  slug: string;
}

interface BreadcrumbProps {
  category: BreadcrumbSegment;
  subCategory?: BreadcrumbSegment;
  productTitle: string;
}

export function Breadcrumb({
  category,
  subCategory,
  productTitle,
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <li>
          <Link href="/" className="hover:text-zeeks-purple transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">/</li>
        <li>
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-zeeks-purple transition-colors"
          >
            {category.name}
          </Link>
        </li>
        {subCategory && (
          <>
            <li aria-hidden="true" className="select-none">/</li>
            <li>
              <Link
                href={`/categories/${category.slug}?sub=${subCategory.slug}`}
                className="hover:text-zeeks-purple transition-colors"
              >
                {subCategory.name}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden="true" className="select-none">/</li>
        <li className="font-medium text-gray-900">{productTitle}</li>
      </ol>
    </nav>
  );
}
