import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const controle =
  "min-h-10 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-3 focus:ring-ring/15 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controle, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controle, "min-h-24 resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className="select-wrapper">
      <select
        className={cn(controle, "appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" />
    </span>
  );
}

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 rounded border-border-strong accent-primary focus:ring-3 focus:ring-ring/20",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "grid gap-1.5 text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("m-0 text-xs text-muted", className)} {...props} />;
}
