import { NavBarServer } from "@/components/nav-bar-server";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import NextLink from "next/link";

interface OrderResultPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderResultPage({
  searchParams,
}: OrderResultPageProps) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" ? params.status : null;
  const transactionId =
    typeof params.transactionId === "string" ? params.transactionId : null;

  if (status === "COMPLETED") {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBarServer />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6 px-5 py-16 text-center max-w-md">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h1 className="font-heading text-[32px] font-black leading-[40px] text-text-primary">
              Order Confirmed
            </h1>
            <p className="text-sm text-text-muted">
              Thank you for your purchase! Your order has been received.
            </p>
            {transactionId && (
              <p className="text-xs text-text-muted">
                Order reference:{" "}
                <span className="font-mono font-semibold text-text-primary">
                  {transactionId}
                </span>
              </p>
            )}
            <NextLink href="/shop">
              <Button variant="primary" size="lg">
                Continue Shopping
              </Button>
            </NextLink>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBarServer />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6 px-5 py-16 text-center max-w-md">
            <XCircle className="h-16 w-16 text-status-destructive" />
            <h1 className="font-heading text-[32px] font-black leading-[40px] text-text-primary">
              Payment Not Completed
            </h1>
            <p className="text-sm text-text-muted">
              No charge was made. Your payment was not completed.
            </p>
            <NextLink href="/cart">
              <Button variant="primary" size="lg">
                Return to Cart
              </Button>
            </NextLink>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBarServer />
      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-5 py-16 text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-border-default" />
          <h1 className="font-heading text-[32px] font-black leading-[40px] text-text-primary">
            Order Status
          </h1>
          <p className="text-sm text-text-muted">
            We couldn&apos;t determine your order status. You can check your
            orders for the latest updates.
          </p>
          <NextLink href="/account">
            <Button variant="primary" size="lg">
              View Orders
            </Button>
          </NextLink>
        </div>
      </main>
      <Footer />
    </div>
  );
}
