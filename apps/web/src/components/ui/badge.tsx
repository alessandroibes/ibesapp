import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva("ds-badge", {
  variants: {
    variant: {
      neutral: "ds-badge-neutral",
      primary: "ds-badge-primary",
      success: "ds-badge-success",
      warning: "ds-badge-warning",
      danger: "ds-badge-danger",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
