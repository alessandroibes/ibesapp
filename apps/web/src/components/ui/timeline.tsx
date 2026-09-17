import type { ReactNode } from "react";
export type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  meta?: ReactNode;
};
export function Timeline({
  items,
  label = "Linha do tempo",
}: {
  items: TimelineItem[];
  label?: string;
}) {
  return (
    <ol className="ds-timeline" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <span className="ds-timeline-marker" aria-hidden="true" />
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
            {item.meta && <span>{item.meta}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
