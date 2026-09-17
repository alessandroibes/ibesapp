import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="ds-overlay" />
      <AlertDialogPrimitive.Content
        className={cn("ds-dialog-content", className)}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export function AlertDialogFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("ds-dialog-footer", className)} {...props} />;
}
