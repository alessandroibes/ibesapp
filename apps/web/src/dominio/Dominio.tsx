import { useMemo, useState } from "react";
import { criarApi } from "./api";
import { Pessoas } from "./Pessoas";
import { Instituicao } from "./Instituicao";
import { Manuais } from "./Manuais";
import { Agenda } from "./Agenda";
import { Organizacao } from "./Organizacao";
import { Competicoes } from "./Competicoes";
import { Financeiro } from "./Financeiro";
import { AcervoHistorico } from "./AcervoHistorico";
import { Button } from "../components/ui/button";
export function Dominio({
  igrejaId,
  permissoes,
}: {
  igrejaId: string;
  permissoes: string[];
}) {
  const secoes = [
    {
      id: "pessoas",
      nome: "Pessoas e jornada",
      permissao: "pessoas.consultar",
    },
    {
      id: "instituicao",
      nome: "Igreja e Embaixada",
      permissao: "embaixada.consultar",
    },
    { id: "manuais", nome: "Manuais", permissao: "progressao.consultar" },
    { id: "agenda", nome: "Agenda e reuniões", permissao: "agenda.consultar" },
    {
      id: "organizacao",
      nome: "Consulados e Diretoria",
      permissao: "organizacao.consultar",
    },
    {
      id: "competicoes",
      nome: "Competições",
      permissao: "competicoes.consultar",
    },
    { id: "financeiro", nome: "Financeiro", permissao: "financeiro.consultar" },
    { id: "acervo", nome: "Acervo histórico", permissao: "acervo.consultar" },
  ].filter((s) => permissoes.includes(s.permissao));
  const [secao, setSecao] = useState(secoes[0]?.id ?? "");
  const api = useMemo(() => criarApi(igrejaId), [igrejaId]);
  return (
    <div className="dominio">
      <nav aria-label="Gestão da Embaixada">
        {secoes.map((s) => (
          <Button
            key={s.id}
            variant={s.id === secao ? "default" : "outline"}
            aria-current={s.id === secao ? "page" : undefined}
            onClick={() => setSecao(s.id)}
          >
            {s.nome}
          </Button>
        ))}
      </nav>
      {secao === "pessoas" && (
        <Pessoas api={api} igrejaId={igrejaId} permissoes={permissoes} />
      )}
      {secao === "instituicao" && (
        <Instituicao
          api={api}
          editar={permissoes.includes("embaixada.editar")}
          podeConsultarPessoas={permissoes.includes("pessoas.consultar")}
        />
      )}
      {secao === "manuais" && (
        <Manuais api={api} editar={permissoes.includes("manuais.gerenciar")} />
      )}
      {secao === "agenda" && <Agenda api={api} permissoes={permissoes} />}
      {secao === "organizacao" && (
        <Organizacao
          api={api}
          gerenciar={permissoes.includes("organizacao.gerenciar")}
        />
      )}
      {secao === "competicoes" && (
        <Competicoes
          api={api}
          gerenciar={permissoes.includes("competicoes.gerenciar")}
        />
      )}
      {secao === "financeiro" && (
        <Financeiro
          api={api}
          gerenciar={permissoes.includes("financeiro.gerenciar")}
        />
      )}
      {secao === "acervo" && (
        <AcervoHistorico
          api={api}
          igrejaId={igrejaId}
          gerenciar={permissoes.includes("acervo.gerenciar")}
        />
      )}
    </div>
  );
}
