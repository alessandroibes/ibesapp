import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="ds-breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight aria-hidden="true" />}
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BreadcrumbText({ children }: { children: ReactNode }) {
  return <span className="ds-breadcrumb-text">{children}</span>;
}
