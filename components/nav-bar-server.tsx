import { getNavCategories } from "@/lib/data/categories";
import { NavBar } from "@/components/nav-bar";
import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCartItemCount } from "@/lib/square/cart";
import { getGuestCartOrderId } from "@/lib/square/cookies";

/**
 * Server Component wrapper for the NavBar.
 *
 * Fetches category data from Square on the server and
 * passes it to the client-side NavBar component.
 * Also fetches the cart item count for both authenticated users and guests.
 */
export async function NavBarServer() {
  const categories = await getNavCategories();

  let cartItemCount: number | undefined;

  try {
    const { userId } = await auth();
    if (userId) {
      const squareCustomerId = await getSquareCustomerId(userId);
      if (squareCustomerId) {
        cartItemCount = await getCartItemCount(squareCustomerId);
      }
    } else {
      const guestOrderId = await getGuestCartOrderId();
      if (guestOrderId) {
        const count = await getCartItemCount(null, guestOrderId);
        if (count >= 0) {
          cartItemCount = count;
        }
      }
    }
  } catch (error) {
    console.error("NavBarServer: failed to fetch cart count:", error);
  }

  return <NavBar categories={categories} cartItemCount={cartItemCount} />;
}
