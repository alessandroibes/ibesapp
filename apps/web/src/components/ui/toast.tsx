import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastMessage = { id: number; title: string; description?: string };
type ToastContextValue = {
  showToast: (title: string, description?: string) => void;
};
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const showToast = useCallback((title: string, description?: string) => {
    setMessages((current) => [
      ...current,
      { id: Date.now(), title, description },
    ]);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            className="ds-toast"
            defaultOpen
            onOpenChange={(open) => {
              if (!open)
                setMessages((current) =>
                  current.filter((item) => item.id !== message.id),
                );
            }}
          >
            <ToastPrimitive.Title className="ds-toast-title">
              {message.title}
            </ToastPrimitive.Title>
            {message.description && (
              <ToastPrimitive.Description className="ds-toast-description">
                {message.description}
              </ToastPrimitive.Description>
            )}
            <ToastPrimitive.Close
              className="ds-toast-close"
              aria-label="Fechar notificação"
            >
              <X aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="ds-toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}
