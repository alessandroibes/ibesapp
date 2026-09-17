import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function Avatar({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("ds-avatar", className)} {...props} />;
}
export function AvatarImage({ className, ...props }: ComponentProps<"img">) {
  return <img className={cn("ds-avatar-image", className)} {...props} />;
}
export function AvatarFallback({
  className,
  ...props
}: ComponentProps<"span">) {
  return <span className={cn("ds-avatar-fallback", className)} {...props} />;
}
