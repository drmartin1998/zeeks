import type { CustomerProfile } from "@/lib/square/types";

interface ProfileHeaderCardProps {
  profile: CustomerProfile | null;
  error: string | null;
}

function getInitials(profile: CustomerProfile | null): string {
  if (!profile) return "U";
  const first = profile.givenName?.charAt(0) ?? "";
  const last = profile.familyName?.charAt(0) ?? "";
  return (first + last).toUpperCase() || "U";
}

function getDisplayName(profile: CustomerProfile | null): string {
  if (!profile) return "User";
  return [profile.givenName, profile.familyName].filter(Boolean).join(" ") || "User";
}

export function ProfileHeaderCard({ profile, error }: ProfileHeaderCardProps) {
  if (error) {
    return (
      <div className="rounded-[20px] border border-border bg-card p-8 shadow-[0_4px_16px_rgba(14,14,44,0.04)]">
        <p className="text-sm text-muted-foreground">
          Unable to load profile information
        </p>
      </div>
    );
  }

  const initials = getInitials(profile);
  const displayName = getDisplayName(profile);
  const email = profile?.emailAddress;

  return (
    <div className="flex items-center justify-between rounded-[20px] border border-border bg-card p-8 shadow-[0_4px_16px_rgba(14,14,44,0.04)]">
      <div className="flex items-center gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-border bg-[#7B4FA2]">
          <span className="font-heading text-[36px] font-black text-white">
            {initials}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-[32px] font-black leading-none text-primary">
            {displayName}
          </h2>
          {email && (
            <p className="font-ui text-[15px] font-normal leading-none text-tertiary">
              {email}
            </p>
          )}
          <p className="font-ui text-[13px] font-medium leading-none text-[#E89516]">
            Member since January 2023
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="rounded-lg border-2 border-[#7B4FA2] px-6 py-3.5 font-ui text-[14px] font-bold text-[#7B4FA2]">
          Edit Profile
        </button>
        <button className="rounded-lg bg-[#F5A623] px-6 py-3.5 font-ui text-[14px] font-bold text-white">
          Account Settings
        </button>
      </div>
    </div>
  );
}
