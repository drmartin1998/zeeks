import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Zeeks",
  description: "Review and manage items in your shopping cart",
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
