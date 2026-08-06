import { auth } from "@clerk/nextjs/server";
import { Footer } from "@/components/footer";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCart, findExistingDraftOrder } from "@/lib/square/cart";
import { getGuestCartOrderId } from "@/lib/square/cookies";
import { transferGuestCartToCustomer } from "@/lib/square/cart-transfer";
import { ordersApi } from "@/lib/square/client";
import { CartClient } from "@/components/cart/cart-client";
import { GuestCartSync } from "@/components/cart/guest-cart-sync";
import { GuestLoyaltyNotification } from "@/components/checkout/guest-loyalty-notification";
import { LoyaltyPanel } from "@/components/cart/loyalty-panel/loyalty-panel";
import { EarnedPointsNotice } from "@/components/cart/earned-points-notice";
import { getFirstIssuedReward, fetchLoyaltyAccount } from "@/lib/square/loyalty";
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
      // Pure Square transfer — safe during render. The guest cookie is cleared
      // by <GuestCartSync /> via a Server Action after render.
      await transferGuestCartToCustomer(
        guestOrderId,
        squareCustomerId,
        existing?.orderId ?? null,
      );
    }

    let cart: Cart | null = null;
    let errorMessage: string | null = null;
    let hasReward = false;

    try {
      cart = await getCart(squareCustomerId);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Failed to load cart";
    }

    if (cart?.orderId) {
      try {
        const account = await fetchLoyaltyAccount(squareCustomerId);
        if (account) {
          const reward = await getFirstIssuedReward(account.id);
          hasReward = reward !== null;
        }
      } catch {
        // non-blocking
      }
    }

    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <CartClient
            cart={cart}
            error={errorMessage}
            squareCustomerId={squareCustomerId}
            hasReward={hasReward}
            loyaltyPanel={
              squareCustomerId && cart?.orderId ? (
                <LoyaltyPanel
                  squareCustomerId={squareCustomerId}
                  orderId={cart.orderId}
                />
              ) : null
            }
            earnedPointsNotice={
              squareCustomerId && cart?.orderId ? (
                <EarnedPointsNotice
                  squareCustomerId={squareCustomerId}
                  orderId={cart.orderId}
                />
              ) : null
            }
          />
        </main>
        <GuestCartSync active={Boolean(guestOrderId)} />
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
    orderState = "UNKNOWN";
  }

  if (orderState !== "DRAFT") {
    // Defer clearing the stale guest cookie to a Server Action (via
    // <GuestCartSync />) since cookies() cannot be mutated during render.
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <CartClient cart={null} error={null} squareCustomerId={null} />
        </main>
        <GuestCartSync active />
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
          guestLoyaltyPrompt={
            cart && cart.lineItems.length > 0 ? (
              <GuestLoyaltyNotification
                isGuest
                cartIsNonEmpty
                checkoutPath="/cart"
                isLoyaltyConfigured={!!process.env.SQUARE_LOYALTY_PROGRAM_ID}
              />
            ) : null
          }
        />
      </main>
      <Footer />
    </div>
  );
}
