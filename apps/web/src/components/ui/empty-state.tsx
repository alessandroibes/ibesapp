import { Inbox, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="ds-empty-state">
      {icon ?? <Inbox aria-hidden="true" />}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
export function AccessDeniedState({
  description = "Você não possui permissão para acessar este conteúdo.",
}: {
  description?: string;
}) {
  return (
    <EmptyState
      title="Acesso não autorizado"
      description={description}
      icon={<LockKeyhole aria-hidden="true" />}
    />
  );
}
