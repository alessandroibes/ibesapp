import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="ds-page-header">
      <div className="ds-page-heading">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <div className="ds-page-title-row">
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="ds-page-actions">{actions}</div>}
        </div>
        {meta && <div className="ds-page-meta">{meta}</div>}
      </div>
    </header>
  );
}
