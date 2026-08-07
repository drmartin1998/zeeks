import { SquareClient, SquareEnvironment } from "square";
import { env } from "@/lib/env";

export const squareClient = new SquareClient({
  token: env.SQUARE_ACCESS_TOKEN,
  environment:
    env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export const catalogApi = squareClient.catalog;
export const customersApi = squareClient.customers;
export const loyaltyApi = squareClient.loyalty;
export const ordersApi = squareClient.orders;
export const checkoutApi = squareClient.checkout;
export const paymentsApi = squareClient.payments;
export const locationsApi = squareClient.locations;
export const locationId = env.SQUARE_LOCATION_ID;
export const squareAccessToken = env.SQUARE_ACCESS_TOKEN;
