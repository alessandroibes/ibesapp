import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ds-overlay" />
      <DialogPrimitive.Content
        className={cn("ds-dialog-content", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ds-dialog-close" aria-label="Fechar">
          <X aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ds-dialog-header", className)} {...props} />;
}
export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("ds-dialog-title", className)}
      {...props}
    />
  );
}
export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("ds-dialog-description", className)}
      {...props}
    />
  );
}
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ds-dialog-footer", className)} {...props} />;
}
