import { loyaltyApi, catalogApi } from "@/lib/square/client";
import type {
  LoyaltyAccount,
  RewardTier,
  LoyaltyReward,
  LoyaltyProgramDetail,
  EarnedPoints,
  LoyaltyPanelData,
} from "@/lib/square/types";

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

// ---------------------------------------------------------------------------
// Rewards Redemption (027-rewards-redemption)
// ---------------------------------------------------------------------------

export async function fetchLoyaltyAccount(
  customerId: string,
): Promise<LoyaltyAccount | null> {
  const response = await loyaltyApi.accounts.search({
    query: { customerIds: [customerId] },
    limit: 1,
  });

  const raw = response.loyaltyAccounts?.[0];
  if (!raw) return null;

  return {
    id: raw.id ?? "",
    balance: Number(raw.balance ?? 0),
    lifetimePoints: Number(raw.lifetimePoints ?? 0),
    customerId: raw.customerId ?? customerId,
    programId: raw.programId ?? "",
    enrolledAt: raw.enrolledAt ?? null,
  };
}

export async function fetchLoyaltyProgram(): Promise<LoyaltyProgramDetail | null> {
  if (!isLoyaltyConfigured()) return null;

  const response = await loyaltyApi.programs.get({
    programId: "main",
  });

  const program = response.program;
  if (!program) return null;

  const tiers: RewardTier[] = await Promise.all(
    (program.rewardTiers ?? []).map(async (tier) => {
      const base: RewardTier = {
        id: tier.id ?? "",
        name: tier.name ?? "",
        points: tier.points ?? 0,
        description: null,
        discountType: null,
        discountAmount: null,
        discountPercentage: null,
      };

      const ref = tier.pricingRuleReference;
      if (!ref?.objectId) return base;

      try {
        const catalogResp = await catalogApi.object.get({
          objectId: ref.objectId,
          includeRelatedObjects: true,
          catalogVersion: ref.catalogVersion,
        });

        const pricingRule = (catalogResp.object as unknown as Record<string, unknown>)?.pricingRuleData as Record<string, unknown> | undefined;
        if (!pricingRule) return base;

        const discountId = pricingRule.discountId as string | undefined;
        if (!discountId) return base;

        const related = (catalogResp.relatedObjects as unknown as Array<Record<string, unknown>>) ?? [];
        const discountObj = related.find(
          (o) => o.type === "DISCOUNT" && o.id === discountId,
        );
        if (!discountObj) return base;

        const discountData = discountObj.discountData as Record<string, unknown> | undefined;
        if (!discountData) return base;

        const discountType = discountData.discountType as string | undefined;
        if (discountType === "FIXED_AMOUNT") {
          base.discountType = "FIXED_AMOUNT";
          const amountMoney = discountData.amountMoney as Record<string, unknown> | undefined;
          base.discountAmount = Number(amountMoney?.amount ?? 0);
        } else if (discountType === "FIXED_PERCENTAGE") {
          base.discountType = "FIXED_PERCENTAGE";
          base.discountPercentage = String(discountData.percentage ?? "");
        }
      } catch {
        // pricing rule resolution failed, return base tier without discount info
      }

      return base;
    }),
  );

  return {
    id: program.id ?? "",
    status: program.status ?? "INACTIVE",
    rewardTiers: tiers,
  };
}

export async function fetchActiveReward(
  orderId: string,
  loyaltyAccountId: string,
): Promise<LoyaltyReward | null> {
  const response = await loyaltyApi.rewards.search({
    query: {
      loyaltyAccountId,
      status: "ISSUED",
    },
    limit: 10,
  });

  const rewards = response.rewards ?? [];
  const active = rewards.find(
    (r) => r.orderId === orderId && r.status === "ISSUED",
  );

  if (!active) return null;

  return {
    id: active.id ?? "",
    status: (active.status as LoyaltyReward["status"]) ?? "ISSUED",
    loyaltyAccountId: active.loyaltyAccountId ?? loyaltyAccountId,
    rewardTierId: active.rewardTierId ?? "",
    points: active.points ?? 0,
    orderId: active.orderId ?? null,
    createdAt: active.createdAt ?? "",
  };
}

export async function fetchEarnedPoints(
  orderId: string,
  squareCustomerId: string,
): Promise<EarnedPoints> {
  try {
    const account = await fetchLoyaltyAccount(squareCustomerId);
    if (!account) {
      return { points: null, error: "No loyalty account found" };
    }

    const response = await loyaltyApi.programs.calculate({
      programId: loyaltyProgramId!,
      orderId,
      loyaltyAccountId: account.id,
    });

    return {
      points: response.points ?? 0,
      error: null,
    };
  } catch (error) {
    return {
      points: null,
      error: error instanceof Error ? error.message : "Failed to calculate points",
    };
  }
}

export async function getLoyaltyPanelData(
  squareCustomerId: string,
  orderId: string,
): Promise<LoyaltyPanelData> {
  if (!isLoyaltyConfigured()) {
    return {
      account: null,
      program: null,
      activeReward: null,
      earnedPoints: null,
      error: null,
    };
  }

  const [accountResult, programResult] = await Promise.allSettled([
    fetchLoyaltyAccount(squareCustomerId),
    fetchLoyaltyProgram(),
  ]);

  const account =
    accountResult.status === "fulfilled" ? accountResult.value : null;
  const program =
    programResult.status === "fulfilled" ? programResult.value : null;

  if (accountResult.status === "rejected" || !account) {
    return {
      account: null,
      program: null,
      activeReward: null,
      earnedPoints: null,
      error: null,
    };
  }

  const [rewardResult, pointsResult] = await Promise.allSettled([
    getFirstIssuedReward(account.id),
    fetchEarnedPoints(orderId, squareCustomerId),
  ]);

  const activeReward =
    rewardResult.status === "fulfilled" ? rewardResult.value : null;
  const earnedPoints =
    pointsResult.status === "fulfilled"
      ? pointsResult.value
      : { points: null, error: "Failed to calculate points" };

  return {
    account,
    program,
    activeReward,
    earnedPoints,
    error: null,
  };
}

export async function createLoyaltyReward(
  orderId: string,
  loyaltyAccountId: string,
  rewardTierId: string,
): Promise<{ success: boolean; reward?: LoyaltyReward; error?: string }> {
  const idempotencyKey = `reward-${loyaltyAccountId}-${rewardTierId}`;

  try {
    const response = await loyaltyApi.rewards.create({
      idempotencyKey,
      reward: {
        loyaltyAccountId,
        rewardTierId,
        orderId: orderId || undefined,
      },
    });

    if (response.errors && response.errors.length > 0) {
      const detail = response.errors[0]?.detail ?? "Square rejected the reward";
      return { success: false, error: detail };
    }

    const reward = response.reward;
    if (!reward) {
      return { success: false, error: "Failed to create reward" };
    }

    return {
      success: true,
      reward: {
        id: reward.id ?? "",
        status: (reward.status as LoyaltyReward["status"]) ?? "ISSUED",
        loyaltyAccountId: reward.loyaltyAccountId ?? loyaltyAccountId,
        rewardTierId: reward.rewardTierId ?? rewardTierId,
        points: reward.points ?? 0,
        orderId: reward.orderId ?? null,
        createdAt: reward.createdAt ?? "",
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply reward";
    return { success: false, error: message };
  }
}

export async function deleteLoyaltyReward(
  rewardId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await loyaltyApi.rewards.delete({ rewardId });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove reward";
    return { success: false, error: message };
  }
}

export async function cleanupStaleRewards(
  loyaltyAccountId: string,
): Promise<void> {
  try {
    const response = await loyaltyApi.rewards.search({
      query: {
        loyaltyAccountId,
        status: "ISSUED",
      },
      limit: 50,
    });

    const rewards = response.rewards ?? [];
    for (const reward of rewards) {
      if (reward.id) {
        try {
          await loyaltyApi.rewards.delete({ rewardId: reward.id });
        } catch {
          // skip failed deletions
        }
      }
    }
  } catch {
    // non-blocking cleanup
  }
}

export async function getFirstIssuedReward(
  loyaltyAccountId: string,
): Promise<LoyaltyReward | null> {
  const response = await loyaltyApi.rewards.search({
    query: {
      loyaltyAccountId,
      status: "ISSUED",
    },
    limit: 1,
  });

  const reward = response.rewards?.[0];
  if (!reward) return null;

  return {
    id: reward.id ?? "",
    status: (reward.status as LoyaltyReward["status"]) ?? "ISSUED",
    loyaltyAccountId: reward.loyaltyAccountId ?? loyaltyAccountId,
    rewardTierId: reward.rewardTierId ?? "",
    points: reward.points ?? 0,
    orderId: reward.orderId ?? null,
    createdAt: reward.createdAt ?? "",
  };
}