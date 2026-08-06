import type { CustomerProfile } from "@/lib/square/types";
import Link from "next/link";

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
    <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 shadow-[0_4px_16px_rgba(14,14,44,0.04)] sm:gap-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:p-8">
      <div className="flex items-center gap-4 sm:items-center sm:gap-4 lg:gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-border bg-[#7B4FA2] sm:h-20 sm:w-20 lg:h-24 lg:w-24">
          <span className="font-heading text-[24px] font-black text-white sm:text-[28px] lg:text-[36px]">
            {initials}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 lg:gap-2">
          <h2 className="font-heading font-black leading-none text-primary text-[20px] lg:text-[32px]">
            {displayName}
          </h2>
          {email && (
            <p className="font-ui font-normal leading-none text-tertiary text-[13px] lg:text-[15px]">
              {email}
            </p>
          )}
          <p className="font-ui font-medium leading-none text-[#E89516] text-[12px] lg:text-[13px]">
            Member since January 2023
          </p>
        </div>
      </div>

      <div className="flex gap-3 lg:gap-3">
        <Link
          href="/account/edit"
          className="flex-1 justify-center rounded-lg border-2 border-[#7B4FA2] px-6 py-2.5 font-ui text-[14px] font-bold text-[#7B4FA2] transition-colors hover:bg-[#7B4FA2] hover:text-white sm:flex-none sm:py-3.5"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
