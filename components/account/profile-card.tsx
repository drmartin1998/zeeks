import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CustomerProfile } from "@/lib/square/types";

interface ProfileCardProps {
  profile: CustomerProfile | null;
  error: string | null;
  className?: string;
}

export function ProfileCard({ profile, error, className }: ProfileCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Account Info</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-muted-foreground text-sm">
            Unable to load profile information
          </p>
        ) : profile ? (
          <dl className="space-y-2 text-sm">
            <div className="flex gap-1">
              <dt className="font-medium text-muted-foreground w-16 shrink-0">
                Name
              </dt>
              <dd>
                {[profile.givenName, profile.familyName]
                  .filter(Boolean)
                  .join(" ") || <span className="text-muted-foreground">&mdash;</span>}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium text-muted-foreground w-16 shrink-0">
                Email
              </dt>
              <dd className="break-all">{profile.emailAddress ?? <span className="text-muted-foreground">&mdash;</span>}</dd>
            </div>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
