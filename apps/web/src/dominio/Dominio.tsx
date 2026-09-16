import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { criarApi } from "./api";
import { Pessoas } from "./Pessoas";
import { Instituicao } from "./Instituicao";
import { Manuais } from "./Manuais";
import { Agenda } from "./Agenda";
import { Organizacao } from "./Organizacao";
import { Competicoes } from "./Competicoes";
import { Financeiro } from "./Financeiro";
import { AcervoHistorico } from "./AcervoHistorico";

type IconeNome =
  | "pessoas"
  | "instituicao"
  | "manuais"
  | "agenda"
  | "organizacao"
  | "competicoes"
  | "financeiro"
  | "acervo";

function Icone({ nome }: { nome: IconeNome }) {
  const caminhos: Record<IconeNome, ReactNode> = {
    pessoas: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    instituicao: (
      <>
        <path d="M3 21h18M5 21V10M19 21V10M3 10l9-7 9 7M9 21v-6h6v6" />
      </>
    ),
    manuais: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M4 5.5v14A2.5 2.5 0 0 0 6.5 22H20" />
      </>
    ),
    agenda: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01" />
      </>
    ),
    organizacao: (
      <>
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <path d="M12 8v4M5 16v-2h14v2" />
      </>
    ),
    competicoes: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" />
      </>
    ),
    financeiro: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 15h2" />
      </>
    ),
    acervo: (
      <>
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <path d="M5 9v11h14V9M10 13h4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {caminhos[nome]}
    </svg>
  );
}

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
      resumo: "Cadastros e progressão",
      permissao: "pessoas.consultar",
    },
    {
      id: "instituicao",
      nome: "Igreja e Embaixada",
      resumo: "Dados institucionais",
      permissao: "embaixada.consultar",
    },
    {
      id: "manuais",
      nome: "Manuais",
      resumo: "Versões e tarefas",
      permissao: "progressao.consultar",
    },
    {
      id: "agenda",
      nome: "Agenda e reuniões",
      resumo: "Atividades e frequência",
      permissao: "agenda.consultar",
    },
    {
      id: "organizacao",
      nome: "Consulados e Diretoria",
      resumo: "Organização e mandatos",
      permissao: "organizacao.consultar",
    },
    {
      id: "competicoes",
      nome: "Competições",
      resumo: "Aptidões e escalações",
      permissao: "competicoes.consultar",
    },
    {
      id: "financeiro",
      nome: "Financeiro",
      resumo: "Entradas e saídas",
      permissao: "financeiro.consultar",
    },
    {
      id: "acervo",
      nome: "Acervo histórico",
      resumo: "Memória da Embaixada",
      permissao: "acervo.consultar",
    },
  ].filter((s) => permissoes.includes(s.permissao));
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const api = useMemo(() => criarApi(igrejaId), [igrejaId]);
  const location = useLocation();
  const secao =
    location.pathname.split("/").filter(Boolean)[0] ?? secoes[0]?.id;
  const atual = secoes.find((item) => item.id === secao) ?? secoes[0];
  const abrirMenu = () => {
    setMenuAberto(true);
    requestAnimationFrame(() =>
      document.getElementById(`link-${secao}`)?.focus({ preventScroll: true }),
    );
  };
  const fecharMenu = () => {
    setMenuAberto(false);
    requestAnimationFrame(() =>
      botaoMenu.current?.focus({ preventScroll: true }),
    );
  };
  return (
    <div className="dominio">
      <button
        ref={botaoMenu}
        className="abrir-navegacao"
        type="button"
        aria-expanded={menuAberto}
        aria-controls="navegacao-principal"
        onClick={abrirMenu}
      >
        <span aria-hidden="true">☰</span> Áreas de trabalho
      </button>
      {menuAberto && (
        <button
          className="fundo-navegacao"
          aria-label="Fechar navegação"
          onClick={fecharMenu}
        />
      )}
      <aside
        id="navegacao-principal"
        className={`navegacao-dominio${menuAberto ? " navegacao-aberta" : ""}`}
      >
        <div className="titulo-navegacao">
          <div>
            <p>Navegação</p>
            <strong>Áreas de trabalho</strong>
          </div>
          <button
            type="button"
            aria-label="Fechar navegação"
            onClick={fecharMenu}
          >
            ×
          </button>
        </div>
        <nav aria-label="Gestão da Embaixada">
          {secoes.map((s) => (
            <Link
              key={s.id}
              id={`link-${s.id}`}
              to={`/${s.id}`}
              className={`item-navegacao${s.id === secao ? " item-navegacao-ativo" : ""}`}
              aria-label={s.nome}
              aria-current={s.id === secao ? "page" : undefined}
              onClick={() => setMenuAberto(false)}
            >
              <Icone nome={s.id as IconeNome} />
              <span>
                <strong>{s.nome}</strong>
                <small>{s.resumo}</small>
              </span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="area-modulo">
        <div className="identificacao-modulo">
          <div className="icone-modulo">
            {atual && <Icone nome={atual.id as IconeNome} />}
          </div>
          <div>
            <span>Área atual</span>
            <strong>{atual?.nome}</strong>
          </div>
        </div>
        <div className="painel-dominio">
          <Routes>
            <Route
              index
              element={
                secoes[0] ? (
                  <Navigate to={`/${secoes[0].id}`} replace />
                ) : (
                  <p>Você não possui acesso às áreas de trabalho.</p>
                )
              }
            />
            {secoes.some((x) => x.id === "pessoas") && (
              <Route
                path="/pessoas/*"
                element={
                  <Pessoas
                    api={api}
                    igrejaId={igrejaId}
                    permissoes={permissoes}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "instituicao") && (
              <Route
                path="/instituicao"
                element={
                  <Instituicao
                    api={api}
                    editar={permissoes.includes("embaixada.editar")}
                    podeConsultarPessoas={permissoes.includes(
                      "pessoas.consultar",
                    )}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "manuais") && (
              <Route
                path="/manuais"
                element={
                  <Manuais
                    api={api}
                    editar={permissoes.includes("manuais.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "agenda") && (
              <Route
                path="/agenda"
                element={<Agenda api={api} permissoes={permissoes} />}
              />
            )}
            {secoes.some((x) => x.id === "organizacao") && (
              <Route
                path="/organizacao"
                element={
                  <Organizacao
                    api={api}
                    gerenciar={permissoes.includes("organizacao.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "competicoes") && (
              <Route
                path="/competicoes"
                element={
                  <Competicoes
                    api={api}
                    gerenciar={permissoes.includes("competicoes.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "financeiro") && (
              <Route
                path="/financeiro"
                element={
                  <Financeiro
                    api={api}
                    gerenciar={permissoes.includes("financeiro.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "acervo") && (
              <Route
                path="/acervo"
                element={
                  <AcervoHistorico
                    api={api}
                    igrejaId={igrejaId}
                    gerenciar={permissoes.includes("acervo.gerenciar")}
                  />
                }
              />
            )}
            <Route
              path="*"
              element={
                secoes[0] ? <Navigate to={`/${secoes[0].id}`} replace /> : null
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
