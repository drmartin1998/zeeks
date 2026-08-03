import { loyaltyApi } from "@/lib/square/client";

const loyaltyProgramId = process.env.SQUARE_LOYALTY_PROGRAM_ID;

export function isLoyaltyConfigured(): boolean {
  return !!loyaltyProgramId;
}

export async function searchLoyaltyAccount(customerId: string) {
  const response = await loyaltyApi.accounts.search({
    query: { customerIds: [customerId] },
    limit: 1,
  });

  const accounts = response.loyaltyAccounts ?? [];
  return accounts[0] ?? null;
}

export async function createLoyaltyAccount(
  customerId: string,
  phoneNumber: string,
) {
  const response = await loyaltyApi.accounts.create({
    loyaltyAccount: {
      programId: loyaltyProgramId!,
      customerId,
      mapping: { phoneNumber },
    },
    idempotencyKey: `loyalty-${customerId}`,
  });

  return response.loyaltyAccount ?? null;
}
