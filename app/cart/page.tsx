import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCart } from "@/lib/square/cart";
import { CartClient } from "@/components/cart/cart-client";
import type { Cart } from "@/lib/square/types";

export default async function CartPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <CartClient cart={null} error="Account setup in progress. Please try again shortly." />
        </main>
        <Footer />
      </div>
    );
  }

  let cart: Cart | null = null;
  let errorMessage: string | null = null;

  try {
    cart = await getCart(squareCustomerId);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load cart";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <CartClient cart={cart} error={errorMessage} />
      </main>
      <Footer />
    </div>
  );
}
