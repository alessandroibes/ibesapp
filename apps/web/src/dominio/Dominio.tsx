import {
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Archive,
  BookOpen,
  Building2,
  CalendarDays,
  Landmark,
  Menu,
  Network,
  Trophy,
  UsersRound,
  WalletCards,
  type LucideProps,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AccessDeniedState,
  Badge,
  Button,
  PageHeader,
  PageSkeleton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../components/ui";
import { AcervoHistorico } from "./AcervoHistorico";
import { criarApi } from "./api";
import { CompeticoesNova } from "./CompeticoesNova";
import { Conselheiros } from "./Conselheiros";
import { Financeiro } from "./Financeiro";
import { Instituicao } from "./Instituicao";
import { Manuais } from "./Manuais";
import { OrganizacaoNova } from "./OrganizacaoNova";
import { Pessoas } from "./Pessoas";

const Agenda = lazy(() =>
  import("./Agenda").then((modulo) => ({ default: modulo.Agenda })),
);

type Icone = ComponentType<LucideProps>;
type Grupo = "Gestão" | "Operação" | "Organização" | "Administração";
type Secao = {
  id: string;
  nome: string;
  resumo: string;
  grupo: Grupo;
  permissao: string;
  icone: Icone;
};

const todasSecoes: Secao[] = [
  {
    id: "pessoas",
    nome: "Meninos e jornada",
    resumo: "Embaixadores, Candidatos e Visitantes",
    grupo: "Gestão",
    permissao: "pessoas.consultar",
    icone: UsersRound,
  },
  {
    id: "conselheiros",
    nome: "Conselheiros",
    resumo: "Responsáveis pela Embaixada",
    grupo: "Gestão",
    permissao: "embaixada.consultar",
    icone: UsersRound,
  },
  {
    id: "instituicao",
    nome: "Igreja e Embaixada",
    resumo: "Dados institucionais",
    grupo: "Gestão",
    permissao: "embaixada.consultar",
    icone: Building2,
  },
  {
    id: "manuais",
    nome: "Manuais",
    resumo: "Versões e tarefas",
    grupo: "Gestão",
    permissao: "progressao.consultar",
    icone: BookOpen,
  },
  {
    id: "agenda",
    nome: "Agenda e reuniões",
    resumo: "Atividades e frequência",
    grupo: "Operação",
    permissao: "agenda.consultar",
    icone: CalendarDays,
  },
  {
    id: "competicoes",
    nome: "Competições",
    resumo: "Aptidões e escalações",
    grupo: "Operação",
    permissao: "competicoes.consultar",
    icone: Trophy,
  },
  {
    id: "organizacao",
    nome: "Consulados e Diretoria",
    resumo: "Organização e mandatos",
    grupo: "Organização",
    permissao: "organizacao.consultar",
    icone: Network,
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    resumo: "Entradas e saídas",
    grupo: "Administração",
    permissao: "financeiro.consultar",
    icone: WalletCards,
  },
  {
    id: "acervo",
    nome: "Acervo histórico",
    resumo: "Memória da Embaixada",
    grupo: "Administração",
    permissao: "acervo.consultar",
    icone: Archive,
  },
];
const grupos: Grupo[] = ["Gestão", "Operação", "Organização", "Administração"];

function Navegacao({
  secoes,
  secaoAtual,
  embaixada,
  igreja,
  aoNavegar,
}: {
  secoes: Secao[];
  secaoAtual?: string;
  embaixada: string;
  igreja: string;
  aoNavegar?: () => void;
}) {
  return (
    <div className="conteudo-navegacao">
      <div className="contexto-navegacao">
        <span className="icone-contexto" aria-hidden="true">
          <Landmark />
        </span>
        <div>
          <span>Embaixada</span>
          <strong>{embaixada}</strong>
          <small>{igreja}</small>
        </div>
      </div>
      <nav aria-label="Gestão da Embaixada">
        {grupos.map((grupo) => {
          const itens = secoes.filter((secao) => secao.grupo === grupo);
          if (itens.length === 0) return null;
          return (
            <div className="grupo-navegacao" key={grupo}>
              <p>{grupo}</p>
              {itens.map((secao) => {
                const Icon = secao.icone;
                return (
                  <Link
                    key={secao.id}
                    to={`/${secao.id}`}
                    className={`item-navegacao${secao.id === secaoAtual ? " item-navegacao-ativo" : ""}`}
                    aria-label={secao.nome}
                    aria-current={secao.id === secaoAtual ? "page" : undefined}
                    onClick={aoNavegar}
                  >
                    <Icon aria-hidden="true" />
                    <span>
                      <strong>{secao.nome}</strong>
                      <small>{secao.resumo}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="rodape-navegacao">
        <Badge variant="success">Contexto ativo</Badge>
      </div>
    </div>
  );
}

export function Dominio({
  igrejaId,
  nomeIgreja,
  nomeEmbaixada,
  permissoes,
}: {
  igrejaId: string;
  nomeIgreja: string;
  nomeEmbaixada: string;
  permissoes: string[];
}) {
  const secoes = todasSecoes.filter((secao) =>
    permissoes.includes(secao.permissao),
  );
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const api = useMemo(() => criarApi(igrejaId), [igrejaId]);
  const location = useLocation();
  const secao =
    location.pathname.split("/").filter(Boolean)[0] ?? secoes[0]?.id;
  const atual = secoes.find((item) => item.id === secao) ?? secoes[0];

  return (
    <div className="dominio">
      <aside className="navegacao-dominio navegacao-desktop">
        <Navegacao
          secoes={secoes}
          secaoAtual={secao}
          embaixada={nomeEmbaixada}
          igreja={nomeIgreja}
        />
      </aside>
      <div className="area-modulo">
        <Sheet
          open={menuAberto}
          onOpenChange={(aberto) => {
            setMenuAberto(aberto);
            if (!aberto)
              requestAnimationFrame(() =>
                botaoMenu.current?.focus({ preventScroll: true }),
              );
          }}
        >
          <SheetTrigger asChild>
            <Button
              ref={botaoMenu}
              className="abrir-navegacao"
              variant="outline"
            >
              <Menu aria-hidden="true" /> Áreas de trabalho
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="somente-leitor">
              Áreas de trabalho
            </SheetTitle>
            <SheetDescription className="somente-leitor">
              Navegue pelas áreas permitidas da Embaixada.
            </SheetDescription>
            <Navegacao
              secoes={secoes}
              secaoAtual={secao}
              embaixada={nomeEmbaixada}
              igreja={nomeIgreja}
              aoNavegar={() => setMenuAberto(false)}
            />
          </SheetContent>
        </Sheet>
        {atual && ["pessoas", "conselheiros", "agenda"].includes(atual.id) && (
          <PageHeader
            title={atual.nome}
            description={atual.resumo}
            breadcrumbs={[{ label: "Embaixada" }, { label: atual.nome }]}
            meta={
              <span className="metadado-igreja">
                {nomeEmbaixada} · {nomeIgreja}
              </span>
            }
          />
        )}
        <div className="painel-dominio">
          <Routes>
            <Route
              index
              element={
                secoes[0] ? (
                  <Navigate to={`/${secoes[0].id}`} replace />
                ) : (
                  <AccessDeniedState description="Você não possui acesso às áreas de trabalho desta Igreja." />
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
                path="/instituicao/*"
                element={
                  <Instituicao
                    api={api}
                    editar={permissoes.includes("embaixada.editar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "conselheiros") && (
              <Route
                path="/conselheiros/*"
                element={
                  <Conselheiros
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
                path="/manuais/*"
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
                path="/agenda/*"
                element={
                  <Suspense
                    fallback={<PageSkeleton label="Carregando agenda" />}
                  >
                    <Agenda api={api} permissoes={permissoes} />
                  </Suspense>
                }
              />
            )}
            {secoes.some((x) => x.id === "organizacao") && (
              <Route
                path="/organizacao/*"
                element={
                  <OrganizacaoNova
                    api={api}
                    gerenciar={permissoes.includes("organizacao.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "competicoes") && (
              <Route
                path="/competicoes/*"
                element={
                  <CompeticoesNova
                    api={api}
                    gerenciar={permissoes.includes("competicoes.gerenciar")}
                  />
                }
              />
            )}
            {secoes.some((x) => x.id === "financeiro") && (
              <Route
                path="/financeiro/*"
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
                path="/acervo/*"
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
