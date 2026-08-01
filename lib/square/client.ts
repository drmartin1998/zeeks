import { SquareClient, SquareEnvironment } from "square";
import { env } from "@/lib/env";

const squareEnvironment =
  env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

export const squareClient = new SquareClient({
  token: env.SQUARE_ACCESS_TOKEN,
  environment: squareEnvironment,
});

export const catalogApi = squareClient.catalog;
export const locationId = env.SQUARE_LOCATION_ID;
