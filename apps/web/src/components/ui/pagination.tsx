import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({
  page,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  label,
}: {
  page: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  label?: string;
}) {
  return (
    <nav className="ds-pagination" aria-label={label ?? "Paginação"}>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!canPrevious}
      >
        <ChevronLeft aria-hidden="true" /> Anterior
      </Button>
      <span aria-current="page">Página {page}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        Próxima <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
