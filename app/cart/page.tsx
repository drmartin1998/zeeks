import { auth } from "@clerk/nextjs/server";
import { Footer } from "@/components/footer";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCart, findExistingDraftOrder } from "@/lib/square/cart";
import { getGuestCartOrderId, clearGuestCartOrderId } from "@/lib/square/cookies";
import { transferGuestCartToCustomer } from "@/lib/square/cart-transfer";
import { ordersApi } from "@/lib/square/client";
import { CartClient } from "@/components/cart/cart-client";
import type { Cart } from "@/lib/square/types";

export default async function CartPage() {
  const { userId } = await auth();

  if (userId) {
    const squareCustomerId = await getSquareCustomerId(userId);
    if (!squareCustomerId) {
      return (
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <CartClient cart={null} error="Account setup in progress. Please try again shortly." squareCustomerId={null} />
          </main>
          <Footer />
        </div>
      );
    }

    const guestOrderId = await getGuestCartOrderId();
    if (guestOrderId) {
      const existing = await findExistingDraftOrder(squareCustomerId);
      await transferGuestCartToCustomer(
        guestOrderId,
        squareCustomerId,
        existing?.orderId ?? null,
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
          <CartClient
            cart={cart}
            error={errorMessage}
            squareCustomerId={squareCustomerId}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const guestOrderId = await getGuestCartOrderId();

  if (!guestOrderId) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <CartClient cart={null} error={null} squareCustomerId={null} />
        </main>
        <Footer />
      </div>
    );
  }

  let orderState = "DRAFT";
  try {
    const orderResponse = await ordersApi.get({ orderId: guestOrderId });
    orderState = (orderResponse.order?.state as string) ?? "DRAFT";
  } catch {
    await clearGuestCartOrderId();
    orderState = "UNKNOWN";
  }

  if (orderState !== "DRAFT") {
    await clearGuestCartOrderId();
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <CartClient cart={null} error={null} squareCustomerId={null} />
        </main>
        <Footer />
      </div>
    );
  }

  let cart: Cart | null = null;
  let errorMessage: string | null = null;

  try {
    cart = await getCart(null, guestOrderId);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load cart";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <CartClient
          cart={cart}
          error={errorMessage}
          squareCustomerId={null}
        />
      </main>
      <Footer />
    </div>
  );
}
