import NextLink from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  searchParams: Promise<{ orderId?: string; transactionId?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orderId, transactionId } = params;

  if (!orderId || !transactionId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5">
        <p className="text-lg text-text-muted">Invalid order confirmation link.</p>
        <NextLink href="/">
          <Button variant="primary" className="mt-4">
            Return to Store
          </Button>
        </NextLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="font-heading text-2xl font-black text-text-primary">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-text-muted">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <div className="mt-8 rounded-2xl border border-[#CDCDD8] bg-[#F5F5F8] p-6 text-left">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Order ID</span>
              <span className="font-mono font-semibold text-text-primary">{orderId.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Transaction</span>
              <span className="font-mono font-semibold text-text-primary">{transactionId.slice(0, 12)}...</span>
            </div>
          </div>
        </div>

        <NextLink href="/">
          <Button variant="primary" className="mt-8">
            Continue Shopping
          </Button>
        </NextLink>
      </div>
    </div>
  );
}
