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
  const selecionar = (id: string) => {
    setSecao(id);
  };
  const conteudo =
    secao === "pessoas" ? (
      <Pessoas api={api} igrejaId={igrejaId} permissoes={permissoes} />
    ) : secao === "instituicao" ? (
      <Instituicao
        api={api}
        editar={permissoes.includes("embaixada.editar")}
        podeConsultarPessoas={permissoes.includes("pessoas.consultar")}
      />
    ) : secao === "manuais" ? (
      <Manuais api={api} editar={permissoes.includes("manuais.gerenciar")} />
    ) : secao === "agenda" ? (
      <Agenda api={api} permissoes={permissoes} />
    ) : secao === "organizacao" ? (
      <Organizacao
        api={api}
        gerenciar={permissoes.includes("organizacao.gerenciar")}
      />
    ) : secao === "competicoes" ? (
      <Competicoes
        api={api}
        gerenciar={permissoes.includes("competicoes.gerenciar")}
      />
    ) : secao === "financeiro" ? (
      <Financeiro
        api={api}
        gerenciar={permissoes.includes("financeiro.gerenciar")}
      />
    ) : secao === "acervo" ? (
      <AcervoHistorico
        api={api}
        igrejaId={igrejaId}
        gerenciar={permissoes.includes("acervo.gerenciar")}
      />
    ) : null;
  return (
    <div className="dominio">
      <div className="navegacao-dominio">
        <p>Áreas de trabalho</p>
        <nav aria-label="Gestão da Embaixada" role="tablist">
          {secoes.map((s, indice) => (
            <Button
              key={s.id}
              id={`aba-${s.id}`}
              role="tab"
              variant={s.id === secao ? "default" : "outline"}
              aria-selected={s.id === secao}
              aria-controls={`painel-${s.id}`}
              tabIndex={s.id === secao ? 0 : -1}
              onClick={() => selecionar(s.id)}
              onKeyDown={(evento) => {
                const deslocamento =
                  evento.key === "ArrowRight"
                    ? 1
                    : evento.key === "ArrowLeft"
                      ? -1
                      : 0;
                const destino =
                  evento.key === "Home"
                    ? 0
                    : evento.key === "End"
                      ? secoes.length - 1
                      : deslocamento
                        ? (indice + deslocamento + secoes.length) %
                          secoes.length
                        : -1;
                if (destino < 0) return;
                evento.preventDefault();
                selecionar(secoes[destino].id);
                requestAnimationFrame(() =>
                  document.getElementById(`aba-${secoes[destino].id}`)?.focus(),
                );
              }}
            >
              {s.nome}
            </Button>
          ))}
        </nav>
      </div>
      <div
        id={`painel-${secao}`}
        role="tabpanel"
        aria-labelledby={`aba-${secao}`}
        tabIndex={-1}
        className="painel-dominio"
      >
        {conteudo}
      </div>
    </div>
  );
}
