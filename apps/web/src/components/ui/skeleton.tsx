import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("ds-skeleton", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
export function PageSkeleton({
  label = "Carregando conteúdo",
}: {
  label?: string;
}) {
  return (
    <div className="ds-page-skeleton" role="status" aria-label={label}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <span className="somente-leitor">{label}…</span>
    </div>
  );
}
