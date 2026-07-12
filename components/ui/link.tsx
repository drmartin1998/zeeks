"use client";

import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface LinkProps extends React.ComponentProps<typeof NextLink> {
  underline?: boolean;
}

function Link({ className, underline = true, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn(
        "font-heading text-lg font-semibold transition-colors",
        "text-action-secondary hover:text-action-secondary-hover",
        underline && "underline hover:no-underline",
        className
      )}
      {...props}
    />
  );
}

export { Link };
