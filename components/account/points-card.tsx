import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PointsCardProps {
  balance: number | null;
  error: string | null;
  className?: string;
}

export function PointsCard({ balance, error, className }: PointsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Reward Points</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-muted-foreground text-sm">Points unavailable</p>
        ) : balance === null ? (
          <p className="text-muted-foreground text-sm">
            No points yet &mdash; start earning with your next purchase
          </p>
        ) : (
          <p className="font-heading text-4xl font-bold tabular-nums">
            {balance.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
