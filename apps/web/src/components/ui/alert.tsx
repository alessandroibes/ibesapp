import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";
const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};
export function Alert({
  variant = "info",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { variant?: AlertVariant }) {
  const Icon = icons[variant];
  return (
    <div
      className={cn("ds-alert", `ds-alert-${variant}`, className)}
      role={variant === "danger" ? "alert" : "status"}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function AlertTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("ds-alert-title", className)} {...props} />;
}
export function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("ds-alert-description", className)} {...props} />;
}
