import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Agenda } from "./Agenda";
import type { Api } from "./api";

const catalogos = {
  promotoras: [{ id: "promotora", versao: "v1", nome: "Embaixada" }],
  tipos: [{ id: "tipo", versao: "v1", nome: "Reunião" }],
  modelos: [],
};
function ocorrencia(indice = 1, situacao = 1) {
  return {
    atividadeId: "atividade-" + indice,
    versao: "v1",
    dataOriginal: "2026-06-15",
    titulo: "Atividade " + indice,
    dataInicio: "2026-06-15",
    dataFim: "2026-06-15",
    horaInicio: null,
    horaFim: null,
    diaInteiro: true,
    fusoHorario: "America/Sao_Paulo",
    situacao,
    local: "Sala da Embaixada",
    observacoes: null,
    promotora: "Embaixada",
    tipo: "Reunião",
    prazo: false,
    destaque: false,
    valor: null,
    moeda: null,
    link: null,
    atividadeRelacionadaId: null,
    reuniaoId: null,
    recorrente: true,
  };
}
function Endereco() {
  return <output data-testid="endereco">{useLocation().search}</output>;
}
function renderizar(api: Api, rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route
          path="/agenda/*"
          element={
            <>
              <Agenda
                api={api}
                permissoes={[
                  "agenda.editar",
                  "agenda.consultar",
                  "frequencia.consultar",
                  "frequencia.registrar",
                ]}
              />
              <Endereco />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}
describe("Agenda e operação", () => {
  it("restaura visualização e filtros e limita eventos na célula mensal", async () => {
    const eventos = Array.from({ length: 6 }, (_, indice) =>
      ocorrencia(indice + 1),
    );
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho === "/agenda/cadastros") return Promise.resolve(catalogos);
      if (caminho.startsWith("/agenda?")) return Promise.resolve(eventos);
      return Promise.resolve({});
    }) as unknown as Api;
    renderizar(api, "/agenda?data=2026-06-15&situacao=4");
    expect(
      await screen.findByLabelText("Calendário mensal"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Data de referência")).toHaveValue(
      "2026-06-15",
    );
    expect(screen.getByLabelText("Filtrar por situação")).toHaveValue("4");
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.stringContaining("situacao=4"),
        undefined,
        undefined,
        expect.any(AbortSignal),
      ),
    );
    expect(
      screen.getByRole("button", { name: "+ 3 outros" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ 3 outros" }));
    expect(
      screen.getByRole("heading", { name: "Compromissos de 15/06/2026" }),
    ).toBeInTheDocument();
    const resumo = screen
      .getByRole("heading", { name: "Compromissos de 15/06/2026" })
      .closest("section")!;
    expect(
      within(resumo).getAllByRole("link", { name: /Ver detalhes/ }),
    ).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Ano" }));
    expect(screen.getByTestId("endereco")).toHaveTextContent("visao=ano");
  });
  it("mantém cadastro e configurações em rotas próprias", async () => {
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho === "/agenda/cadastros") return Promise.resolve(catalogos);
      if (caminho.startsWith("/agenda?")) return Promise.resolve([]);
      return Promise.resolve({});
    }) as unknown as Api;
    renderizar(api, "/agenda/nova");
    expect(
      await screen.findByRole("heading", { name: "Nova atividade" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Nova atividade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/agenda",
    );
  });
  it("exibe detalhe cancelado e preserva acesso à exceção", async () => {
    const usuario = userEvent.setup();
    const item = ocorrencia(1, 4);
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho === "/agenda/cadastros") return Promise.resolve(catalogos);
      if (caminho === "/agenda/atividades/atividade-1")
        return Promise.resolve({ id: "atividade-1", versao: "v1", dados: {} });
      if (caminho.startsWith("/agenda?")) return Promise.resolve([item]);
      return Promise.resolve({});
    }) as unknown as Api;
    renderizar(
      api,
      "/agenda/atividades/atividade-1/ocorrencias/2026-06-15?data=2026-06-15",
    );
    expect(
      await screen.findByRole("heading", { name: "Atividade 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/permanece visível como histórico/),
    ).toBeInTheDocument();
    await usuario.click(screen.getByRole("tab", { name: "Ocorrência" }));
    expect(
      screen.getByRole("form", { name: "Exceção da ocorrência" }),
    ).toBeInTheDocument();
  });
});
