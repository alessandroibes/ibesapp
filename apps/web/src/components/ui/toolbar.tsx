import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function Toolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("ds-toolbar", className)} role="toolbar" {...props} />
  );
}
export function FilterBar({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ds-filter-bar", className)} {...props} />;
}
