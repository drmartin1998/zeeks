interface LoyaltyCardProps {
  balance: number | null;
  error: string | null;
}

export function LoyaltyCard({ balance, error }: LoyaltyCardProps) {
  return (
    <div className="flex flex-col gap-6 rounded-[20px] border border-border bg-card p-8 shadow-[0_4px_16px_rgba(14,14,44,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-extrabold text-primary">
          Zeeks Rewards
        </h2>
        <span className="font-heading text-lg font-semibold text-[#7B4FA2]">
          How to spend points
        </span>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">Points unavailable</p>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-[#F5F5F8] p-6">
          <div className="flex flex-col gap-1">
            <span className="font-ui text-sm font-semibold text-tertiary uppercase tracking-wide">
              Current Balance
            </span>
            <span className="font-heading text-[48px] font-black leading-none text-[#F5A623]">
              {balance != null ? balance.toLocaleString() : "0"}
            </span>
            <span className="font-ui text-[13px] font-medium text-tertiary">
              Points redeemable for $25.00 reward
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="font-heading text-lg font-bold text-primary">
          Recent Points Activity
        </h3>

        <div className="flex justify-between rounded-lg border border-[#F5F5F8] px-4 py-3">
          <span className="font-ui text-sm text-primary">Purchase — Order #ZK-94827</span>
          <span className="font-heading text-sm font-semibold text-[#47B84E]">
            +120 pts
          </span>
        </div>
        <div className="flex justify-between rounded-lg border border-[#F5F5F8] px-4 py-3">
          <span className="font-ui text-sm text-primary">Purchase — Order #ZK-93104</span>
          <span className="font-heading text-sm font-semibold text-[#47B84E]">
            +250 pts
          </span>
        </div>
        <div className="flex justify-between rounded-lg border border-[#F5F5F8] px-4 py-3">
          <span className="font-ui text-sm text-primary">Bonus Points Event</span>
          <span className="font-heading text-sm font-semibold text-[#47B84E]">
            +500 pts
          </span>
        </div>
        <div className="flex justify-between rounded-lg border border-[#F5F5F8] px-4 py-3">
          <span className="font-ui text-sm text-primary">Sign-up Welcome Bonus</span>
          <span className="font-heading text-sm font-semibold text-[#47B84E]">
            +1,000 pts
          </span>
        </div>
      </div>
    </div>
  );
}
