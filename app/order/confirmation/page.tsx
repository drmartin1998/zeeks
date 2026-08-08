import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/square/cart";

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
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

  const order = await getCart(null, orderId);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="font-heading text-2xl font-black text-text-primary sm:text-3xl">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-text-muted">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#CDCDD8] bg-[#F5F5F8] p-6 sm:p-8">
          {/* Order ID — shown in full, transaction ID intentionally omitted */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-text-muted">Order ID</span>
            <span className="break-all font-mono text-sm font-semibold text-text-primary">
              {orderId}
            </span>
          </div>

          {/* Fulfillment method (feature 038) */}
          {order?.fulfillment && (
            <div className="mt-6 border-t border-[#CDCDD8] pt-4">
              <h2 className="font-heading text-lg font-black text-text-primary">
                Delivery
              </h2>
              {order.fulfillment.method === "shipping" &&
              order.fulfillment.shippingAddress ? (
                <div className="mt-2 text-sm text-text-muted">
                  <p className="font-medium text-text-primary">Shipping</p>
                  <p>{order.fulfillment.shippingAddress.recipientName}</p>
                  <p>{order.fulfillment.shippingAddress.addressLine1}</p>
                  {order.fulfillment.shippingAddress.addressLine2 && (
                    <p>{order.fulfillment.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.fulfillment.shippingAddress.city},{" "}
                    {order.fulfillment.shippingAddress.state}{" "}
                    {order.fulfillment.shippingAddress.postalCode}
                  </p>
                </div>
              ) : (
                <div className="mt-2 text-sm text-text-muted">
                  <p className="font-medium text-text-primary">Pickup</p>
                  <p>Order is ready for pickup at our store.</p>
                </div>
              )}
            </div>
          )}

          {/* Items sold */}
          {order && order.lineItems.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-heading text-lg font-black text-text-primary">
                Items Sold
              </h2>
              <div className="mt-4 divide-y divide-[#CDCDD8]">
                {order.lineItems.map((item) => (
                  <div
                    key={item.uid}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Qty {item.quantity} · {fmt(item.unitPrice.amount)} each
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-text-primary sm:shrink-0">
                      {fmt(item.lineTotal.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[#CDCDD8] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-primary">Subtotal</span>
                  <span className="font-semibold text-text-primary">
                    {fmt(order.subtotal.amount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-text-muted">
              Order details could not be loaded.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <NextLink href="/">
            <Button variant="primary" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </NextLink>
        </div>
      </div>
    </div>
  );
}