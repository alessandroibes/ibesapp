import type * as React from "react";
import { cn } from "../../lib/utils";
export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("ds-separator", className)} {...props} />;
}
