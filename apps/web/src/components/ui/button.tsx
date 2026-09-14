import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const variants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary/5",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof variants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component className={cn(variants({ variant }), className)} {...props} />
  );
}
