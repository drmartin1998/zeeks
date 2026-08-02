import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AccountSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard className="md:col-span-2" />
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
