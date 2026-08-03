import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { fetchDashboardData } from "@/lib/square/dashboard";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { NavBarServer } from "@/components/nav-bar-server";
import { Footer } from "@/components/footer";
import { ProfileHeaderCard } from "@/components/account/profile-header-card";
import { LoyaltyCard } from "@/components/account/loyalty-card";
import { OrdersCard } from "@/components/account/orders-card";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const squareCustomerId = await getSquareCustomerId(userId);

  if (!squareCustomerId) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <NavBarServer />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1440px] px-20 py-16 text-center">
            <h1 className="font-heading text-2xl font-semibold mb-4">
              Setting up your account...
            </h1>
            <p className="text-muted-foreground">
              We&apos;re syncing your account with Square. This should only
              take a moment. Please check back shortly.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const data = await fetchDashboardData(squareCustomerId);

  if (data.profileError && data.loyaltyError && data.ordersError) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <NavBarServer />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1440px] px-20 py-16 text-center">
            <h1 className="font-heading text-2xl font-semibold mb-4">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We&apos;re having trouble loading your account dashboard. Please
              try refreshing the page.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBarServer />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1440px] px-20 py-12">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-[#7B4FA2] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="select-none">/</li>
              <li className="font-medium text-[#0E0E2C]">Account</li>
            </ol>
          </nav>
          <div className="flex flex-col gap-10">
            <ProfileHeaderCard
              profile={data.profile}
              error={data.profileError}
            />
            <LoyaltyCard
              balance={data.loyalty ? data.loyalty.balance : null}
              error={data.loyaltyError}
            />
            <OrdersCard
              orders={data.orders}
              nextCursor={data.ordersNextCursor}
              error={data.ordersError}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
