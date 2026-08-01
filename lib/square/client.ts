import { SquareClient, SquareEnvironment } from "square";
import { env } from "@/lib/env";

export const squareClient = new SquareClient({
  token: env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

export const catalogApi = squareClient.catalog;
export const locationId = env.SQUARE_LOCATION_ID;
