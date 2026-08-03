import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/product-detail/breadcrumb";
import { ProductImageGallery } from "@/components/product-detail/product-image-gallery";
import { ProductDetailClient } from "@/components/product-detail/product-detail-client";
import { RelatedProducts } from "@/components/product-detail/related-products";
import { getProductDetailBySlug } from "@/lib/square/catalog";
import type { ProductDetail } from "@/lib/square/types";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string): Promise<ProductDetail | null> {
  return getProductDetailBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product Not Found | Zeeks" };
  }
  return {
    title: `${product.title} | Zeeks`,
    description: product.description ?? `Buy ${product.title} at Zeeks`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          category={product.category}
          subCategory={product.subCategory}
          productTitle={product.title}
        />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Two-column layout: image left, info right */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Product Image Gallery */}
            <ProductImageGallery
              images={product.images}
              title={product.title}
              gradient={product.gradient}
            />

            {/* Product Info (client: handles variation selection state) */}
            <ProductDetailClient product={product} />
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts products={product.relatedProducts} />
      </main>
      <Footer />
    </div>
  );
}
