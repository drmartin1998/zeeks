import Link from "next/link";

interface CategoryCardProps {
  title: string;
  image: string;
  href: string;
}

export function CategoryCard({ title, image, href }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex h-[280px] w-full flex-col justify-end overflow-hidden rounded-2xl shadow-[0_14px_30px_-10px_rgba(93,95,239,0.15)]"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')` }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-40% via-transparent to-transparent" />

      {/* Label */}
      <div className="relative px-6 pb-6 pt-6">
        <h3 className="font-heading text-xl font-bold text-white">
          {title}
        </h3>
      </div>
    </Link>
  );
}
