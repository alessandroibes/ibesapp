import type * as React from "react";
import { cn } from "../../lib/utils";
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="ds-table-container">
      <table className={cn("ds-table", className)} {...props} />
    </div>
  );
}
export function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead {...props} />;
}
export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />;
}
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("ds-table-row", className)} {...props} />;
}
export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("ds-table-head", className)} {...props} />;
}
export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("ds-table-cell", className)} {...props} />;
}
export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return <caption className={cn("ds-table-caption", className)} {...props} />;
}
