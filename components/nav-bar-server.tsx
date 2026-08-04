import { getNavCategories } from "@/lib/data/categories";
import { getLocationBarData } from "@/lib/data/locations";
import { NavBar } from "@/components/nav-bar";
import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCartItemCount } from "@/lib/square/cart";
import { getGuestCartOrderId } from "@/lib/square/cookies";

export async function NavBarServer() {
  const [categoriesResult, locationResult] = await Promise.allSettled([
    getNavCategories(),
    getLocationBarData(),
  ]);

  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const locationData =
    locationResult.status === "fulfilled" ? locationResult.value : null;

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

  return (
    <NavBar
      categories={categories}
      cartItemCount={cartItemCount}
      locationData={locationData}
    />
  );
}
