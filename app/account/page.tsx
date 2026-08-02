import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { fetchDashboardData } from "@/lib/square/dashboard";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { PointsCard } from "@/components/account/points-card";
import { ProfileCard } from "@/components/account/profile-card";
import { OrdersTable } from "@/components/account/orders-table";
import { AccountSkeleton } from "@/components/account/account-skeleton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const squareCustomerId = await getSquareCustomerId(userId);

  if (!squareCustomerId) {
    return <SyncState />;
  }

  const data = await fetchDashboardData(squareCustomerId);

  if (data.profileError && data.loyaltyError && data.ordersError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-semibold mb-6">
          My Account
        </h1>
        <FullPageError />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-semibold mb-6">
        My Account
      </h1>

      <Suspense fallback={<AccountSkeleton />}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PointsCard
            balance={
              data.loyalty
                ? data.loyalty.balance
                : null
            }
            error={data.loyaltyError}
          />
          <ProfileCard
            profile={data.profile}
            error={data.profileError}
          />
          <OrdersTable
            orders={data.orders}
            error={data.ordersError}
            className="md:col-span-2"
          />
        </div>
      </Suspense>
    </div>
  );
}

function SyncState() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold mb-4">
        Setting up your account...
      </h1>
      <p className="text-muted-foreground">
        We&apos;re syncing your account with Square. This should only take a
        moment. Please check back shortly.
      </p>
    </div>
  );
}

function FullPageError() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold mb-4">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-6">
        We&apos;re having trouble loading your account dashboard. Please try
        refreshing the page.
      </p>
    </div>
  );
}
