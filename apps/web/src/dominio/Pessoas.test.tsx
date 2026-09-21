import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Pessoas } from "./Pessoas";
import type { Api } from "./api";

const resumo = {
  id: "p1",
  versao: "v1",
  nome: "Daniel",
  dataNascimento: "2012-04-03",
  situacao: "Candidato",
  ativa: true,
};
const ficha = {
  id: "p1",
  versao: "v1",
  ativa: true,
  possuiFoto: false,
  faixaEtaria: "Adolescente",
  primeiraReuniao: "2025-02-01",
  dados: {
    nome: "Daniel",
    dataNascimento: "2012-04-03",
    naturalidade: null,
    whatsApp: null,
    endereco: null,
    dataBatismo: null,
    localBatismo: null,
    numeroCarteira: null,
    situacaoCarteira: null,
    possuiBiblia: null,
    observacoes: null,
  },
  responsaveis: [],
  vinculos: [],
  alteracoesSituacao: [],
  possuiJornada: false,
  conselheiroVigente: false,
};

function EnderecoAtual() {
  return <output data-testid="endereco-atual">{useLocation().search}</output>;
}

function renderizar(api: Api, rota: string, permissoes: string[] = []) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route
          path="/pessoas/*"
          element={
            <>
              <Pessoas api={api} igrejaId="igreja" permissoes={permissoes} />
              <EnderecoAtual />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Páginas de Pessoas", () => {
  it("restaura filtros pela URL sem expor a busca pelo nome", async () => {
    const api = vi.fn().mockResolvedValue({ total: 1, pessoas: [resumo] });
    renderizar(api as Api, "/pessoas?condicao=candidatos&pagina=2");

    expect(await screen.findByLabelText("Buscar pelo nome")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Candidatos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.stringContaining(
          "busca=&condicao=candidatos&incluirInativos=false&pagina=2",
        ),
        undefined,
        undefined,
        expect.any(AbortSignal),
      ),
    );
    fireEvent.change(screen.getByLabelText("Buscar pelo nome"), {
      target: { value: "Daniel" },
    });
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.stringContaining(
          "busca=Daniel&condicao=candidatos&incluirInativos=false&pagina=1",
        ),
        undefined,
        undefined,
        expect.any(AbortSignal),
      ),
    );
    expect(screen.getByTestId("endereco-atual")).not.toHaveTextContent(
      "Daniel",
    );
  });

  it("mantém Visualizar evidente e inativa por diálogo explícito", async () => {
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho.startsWith("/pessoas?"))
        return Promise.resolve({ total: 1, pessoas: [resumo] });
      if (caminho === "/pessoas/p1") return Promise.resolve(ficha);
      return Promise.resolve({ id: "p1", versao: "v2" });
    }) as unknown as Api;
    renderizar(api, "/pessoas", ["pessoas.editar"]);

    expect(
      await screen.findByRole("link", { name: "Adicionar pessoa" }),
    ).toHaveAttribute("href", "/pessoas/nova");
    expect(screen.getByRole("link", { name: "Visualizar" })).toHaveAttribute(
      "href",
      "/pessoas/p1",
    );
    expect(
      screen.getByRole("button", { name: "Ações para Daniel" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Visualizar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Inativar" }));
    expect(
      screen.getByRole("dialog", { name: "Inativar Daniel" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Motivo *"), {
      target: { value: "Mudança de cidade" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar inativação" }),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/pessoas/p1/inativacao",
        expect.objectContaining({ versao: "v1", motivo: "Mudança de cidade" }),
      ),
    );
    expect(
      await screen.findByText("Pessoa inativada. O histórico foi preservado."),
    ).toBeInTheDocument();
  });

  it("mantém ficha, abas e edição em rotas próprias", async () => {
    const usuario = userEvent.setup();
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho === "/pessoas/p1") return Promise.resolve(ficha);
      if (caminho === "/pessoas/p1/frequencia")
        return Promise.resolve([
          {
            reuniaoId: "r1",
            titulo: "Reunião semanal",
            data: "2025-02-01",
            situacao: 1,
          },
        ]);
      return Promise.resolve([]);
    }) as unknown as Api;
    renderizar(api, "/pessoas/p1", [
      "pessoas.editar",
      "frequencia.consultar",
      "progressao.consultar",
    ]);

    expect(
      await screen.findByRole("heading", { name: "Daniel" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Resumo" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await usuario.click(screen.getByRole("tab", { name: "Frequência" }));
    expect(await screen.findByText("Reunião semanal")).toBeInTheDocument();
    await usuario.click(screen.getByRole("link", { name: "Editar pessoa" }));
    expect(
      await screen.findByRole("heading", { name: "Editar pessoa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Identificação" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/pessoas/p1",
    );
  });

  it("não apresenta Jornada ao Visitante e usa responsáveis sem cadastro de outra Pessoa", async () => {
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho === "/pessoas/p1")
        return Promise.resolve({
          ...ficha,
          responsaveis: [
            {
              id: "r1",
              versao: "rv1",
              relacao: "Mãe",
              nome: "Maria",
              telefoneWhatsApp: "11999999999",
              moraComOEmbaixador: true,
            },
          ],
        });
      return Promise.resolve([]);
    }) as unknown as Api;
    renderizar(api, "/pessoas/p1?aba=jornada", ["pessoas.editar"]);
    expect(
      await screen.findByRole("heading", { name: "Daniel" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Jornada" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Resumo" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await userEvent.click(screen.getByRole("tab", { name: "Vínculos" }));
    expect(screen.getByText("Mãe: Maria")).toBeInTheDocument();
    expect(screen.getAllByText(/Mora com o Embaixador/).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Adicionar responsável")).toBeInTheDocument();
  });
});
