import { useEffect, useMemo, useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { EllipsisVertical, Plus, Search, UsersRound } from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  AccessDeniedState,
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Label,
  PageSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  Toolbar,
} from "../components/ui";
import { estadosFrequencia } from "./Chamada";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { Estado, Formulario, type Campo } from "./componentes";
import { Jornada } from "./Jornada";

type AlteracaoSituacao = {
  tipo: number;
  data: string;
  motivo: string;
  registradoEm: string;
};
type Pessoa = components["schemas"]["PessoaResponse"] & {
  ativa: boolean;
  alteracoesSituacao: AlteracaoSituacao[];
};
type PessoaResumo = components["schemas"]["PessoaResumo"] & { ativa: boolean };
type PessoasResposta = {
  total: number | string;
  pessoas: PessoaResumo[];
};
type Frequencia = components["schemas"]["FrequenciaPessoaResponse"];
type AbaPessoa = "resumo" | "jornada" | "frequencia" | "vinculos" | "historico";

const condicoes = [
  ["todos", "Todos"],
  ["embaixadores", "Embaixadores"],
  ["candidatos", "Candidatos"],
  ["visitantes", "Visitantes"],
  ["inativos", "Inativos"],
] as const;
const abas: AbaPessoa[] = [
  "resumo",
  "jornada",
  "frequencia",
  "vinculos",
  "historico",
];
const camposPessoa: Campo[] = [
  {
    nome: "nome",
    rotulo: "Nome completo",
    obrigatorio: true,
    grupo: "Identificação",
  },
  {
    nome: "dataNascimento",
    rotulo: "Data de nascimento",
    tipo: "date",
    grupo: "Identificação",
  },
  { nome: "naturalidade", rotulo: "Naturalidade", grupo: "Identificação" },
  { nome: "whatsApp", rotulo: "WhatsApp", limite: 40, grupo: "Contato" },
  { nome: "endereco", rotulo: "Endereço", limite: 500, grupo: "Contato" },
  {
    nome: "dataBatismo",
    rotulo: "Data do batismo",
    tipo: "date",
    grupo: "Vida eclesiástica",
  },
  {
    nome: "localBatismo",
    rotulo: "Local do batismo",
    grupo: "Vida eclesiástica",
  },
  {
    nome: "numeroCarteira",
    rotulo: "Número da carteira",
    limite: 80,
    grupo: "Informações da Embaixada",
  },
  {
    nome: "situacaoCarteira",
    rotulo: "Situação da carteira",
    limite: 100,
    grupo: "Informações da Embaixada",
  },
  {
    nome: "possuiBiblia",
    rotulo: "Possui Bíblia",
    tipo: "select",
    grupo: "Informações da Embaixada",
    opcoes: [
      { valor: "true", rotulo: "Sim" },
      { valor: "false", rotulo: "Não" },
    ],
  },
  {
    nome: "observacoes",
    rotulo: "Observações",
    tipo: "textarea",
    limite: 4000,
    grupo: "Observações",
  },
];

function converter(dados: Record<string, string>) {
  return {
    ...Object.fromEntries(
      Object.entries(dados).map(([chave, valor]) => [
        chave,
        valor === "" ? null : valor,
      ]),
    ),
    possuiBiblia:
      dados.possuiBiblia === "" ? null : dados.possuiBiblia === "true",
  };
}

function obterIniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function Foto({ igrejaId, pessoa }: { igrejaId: string; pessoa: Pessoa }) {
  const [imagem, setImagem] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setImagem("");
    if (pessoa.possuiFoto)
      fetch(`/api/v1/pessoas/${pessoa.id}/foto`, {
        headers: { "X-Igreja-Id": igrejaId },
        signal: controller.signal,
      })
        .then(async (resposta) => {
          if (!resposta.ok) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (!controller.signal.aborted) setImagem(reader.result as string);
          };
          reader.readAsDataURL(await resposta.blob());
        })
        .catch(() => undefined);
    return () => controller.abort();
  }, [igrejaId, pessoa.id, pessoa.possuiFoto, pessoa.versao]);
  return (
    <Avatar className="avatar-pessoa">
      {imagem && (
        <AvatarImage src={imagem} alt={`Foto de ${pessoa.dados.nome}`} />
      )}
      {!imagem && (
        <AvatarFallback aria-label={`Sem foto de ${pessoa.dados.nome}`}>
          {obterIniciais(pessoa.dados.nome)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

function DialogoSituacao({
  pessoa,
  api,
  fechar,
  concluido,
}: {
  pessoa: PessoaResumo | Pessoa;
  api: Api;
  fechar: () => void;
  concluido: () => void;
}) {
  const ativa = pessoa.ativa;
  const nome = "nome" in pessoa ? pessoa.nome : pessoa.dados.nome;
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ativa ? "Inativar" : "Reativar"} {nome}
          </DialogTitle>
          <DialogDescription>
            {ativa
              ? "A pessoa deixará de aparecer nas listas e seleções operacionais. Todo o histórico será preservado."
              : "A pessoa voltará a aparecer nas listas e seleções operacionais."}
          </DialogDescription>
        </DialogHeader>
        <Formulario
          titulo={`${ativa ? "Inativar" : "Reativar"} pessoa`}
          texto={ativa ? "Confirmar inativação" : "Confirmar reativação"}
          campos={[
            { nome: "data", rotulo: "Data", tipo: "date", obrigatorio: true },
            {
              nome: "motivo",
              rotulo: "Motivo",
              tipo: "textarea",
              obrigatorio: true,
              limite: 500,
            },
          ]}
          iniciais={{ data: hoje() }}
          acoes={
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
          }
          salvar={async (dados) => {
            await api(
              `/pessoas/${pessoa.id}/${ativa ? "inativacao" : "reativacao"}`,
              { ...dados, versao: pessoa.versao },
            );
            concluido();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ListaPessoas({ api, editar }: { api: Api; editar: boolean }) {
  const [parametros, setParametros] = useSearchParams();
  const [revisao, setRevisao] = useState(0);
  const [alterando, setAlterando] = useState<PessoaResumo>();
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const condicaoInformada = parametros.get("condicao") ?? "todos";
  const condicao = condicoes.some(([valor]) => valor === condicaoInformada)
    ? condicaoInformada
    : "todos";
  const paginaInformada = Number(parametros.get("pagina") ?? "1");
  const pagina =
    Number.isInteger(paginaInformada) && paginaInformada > 0
      ? paginaInformada
      : 1;
  const incluirInativos = condicao === "inativos";

  useEffect(() => {
    if (!parametros.has("busca")) return;
    const proximos = new URLSearchParams(parametros);
    proximos.delete("busca");
    setParametros(proximos, { replace: true });
  }, [parametros, setParametros]);

  function atualizarParametros(
    mudancas: Partial<{ condicao: string; pagina: number }>,
  ) {
    const proximos = new URLSearchParams(parametros);
    proximos.delete("busca");
    const valores = { condicao, pagina, ...mudancas };
    if (valores.condicao !== "todos")
      proximos.set("condicao", valores.condicao);
    else proximos.delete("condicao");
    if (valores.pagina > 1) proximos.set("pagina", String(valores.pagina));
    else proximos.delete("pagina");
    setParametros(proximos, { replace: true });
  }

  const consulta = useConsulta<PessoasResposta>(
    api,
    `/pessoas?busca=${encodeURIComponent(busca)}&condicao=${condicao}&incluirInativos=${incluirInativos}&pagina=${pagina}`,
    revisao,
  );
  const total = Number(consulta.dados?.total ?? 0);

  return (
    <section className="pagina-pessoas" aria-labelledby="titulo-pessoas">
      <Toolbar className="cabecalho-modulo">
        <div>
          <h2 id="titulo-pessoas">Pessoas</h2>
          <p>Localize cadastros e acompanhe a trajetória de cada pessoa.</p>
        </div>
        {editar && (
          <Button asChild>
            <Link to="/pessoas/nova">
              <Plus aria-hidden="true" /> Adicionar pessoa
            </Link>
          </Button>
        )}
      </Toolbar>
      {mensagem && (
        <Alert variant="success">
          <AlertDescription>{mensagem}</AlertDescription>
        </Alert>
      )}
      <Card className="cartao-lista-pessoas">
        <CardHeader>
          <CardTitle>Cadastros</CardTitle>
          <CardDescription>
            Condição e página são mantidas no endereço. A busca pelo nome é
            privada desta sessão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="filtros-pessoas">
            <Label htmlFor="busca-pessoas">
              Buscar pelo nome
              <span className="campo-com-icone">
                <Search aria-hidden="true" />
                <Input
                  id="busca-pessoas"
                  value={busca}
                  maxLength={100}
                  onChange={(evento) => {
                    setBusca(evento.target.value);
                    atualizarParametros({ pagina: 1 });
                  }}
                />
              </span>
            </Label>
            <div
              className="filtro-condicoes-pessoa"
              role="group"
              aria-label="Filtrar pessoas por condição"
            >
              {condicoes.map(([valor, rotulo]) => (
                <Button
                  key={valor}
                  type="button"
                  size="sm"
                  variant={condicao === valor ? "secondary" : "ghost"}
                  aria-pressed={condicao === valor}
                  onClick={() =>
                    atualizarParametros({ condicao: valor, pagina: 1 })
                  }
                >
                  {rotulo}
                </Button>
              ))}
            </div>
            {incluirInativos && (
              <p className="ajuda-filtro">
                Esta visão inclui pessoas ativas e inativas para permitir
                consulta histórica e reativação.
              </p>
            )}
          </div>
          {consulta.loading && <PageSkeleton label="Carregando pessoas" />}
          {consulta.erro && (
            <Alert variant="danger">
              <AlertDescription>{consulta.erro}</AlertDescription>
              <Button
                size="sm"
                onClick={() => setRevisao((valor) => valor + 1)}
              >
                Tentar novamente
              </Button>
            </Alert>
          )}
          {consulta.dados && total === 0 && (
            <EmptyState
              title="Nenhuma pessoa encontrada"
              description="Ajuste a busca ou selecione outra condição."
              icon={<UsersRound aria-hidden="true" />}
              action={
                busca || condicao !== "todos" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBusca("");
                      setParametros(new URLSearchParams(), { replace: true });
                    }}
                  >
                    Limpar filtros
                  </Button>
                ) : undefined
              }
            />
          )}
          {consulta.dados && total > 0 && (
            <>
              <p className="resultado-listagem" role="status">
                {total}{" "}
                {total === 1 ? "pessoa encontrada" : "pessoas encontradas"}.
              </p>
              <Table className="tabela-pessoas">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>
                      <span className="somente-leitor">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consulta.dados.pessoas.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell data-label="Nome">
                        <span className="identidade-lista">
                          <Avatar>
                            <AvatarFallback>
                              {obterIniciais(pessoa.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <strong>{pessoa.nome}</strong>
                        </span>
                      </TableCell>
                      <TableCell data-label="Nascimento">
                        {dataBr(pessoa.dataNascimento)}
                      </TableCell>
                      <TableCell data-label="Condição">
                        <Badge
                          variant={pessoa.situacao ? "primary" : "neutral"}
                        >
                          {pessoa.situacao ?? "Visitante"}
                        </Badge>
                      </TableCell>
                      <TableCell data-label="Situação">
                        <Badge variant={pessoa.ativa ? "success" : "neutral"}>
                          {pessoa.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell data-label="Ações">
                        <div className="acoes-pessoa-lista">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/pessoas/${pessoa.id}`}>Visualizar</Link>
                          </Button>
                          {editar && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Ações para ${pessoa.nome}`}
                                >
                                  <EllipsisVertical aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link to={`/pessoas/${pessoa.id}/editar`}>
                                    Editar cadastro
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => setAlterando(pessoa)}
                                >
                                  {pessoa.ativa ? "Inativar" : "Reativar"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={pagina}
                canPrevious={pagina > 1}
                canNext={pagina * 20 < total}
                onPrevious={() => atualizarParametros({ pagina: pagina - 1 })}
                onNext={() => atualizarParametros({ pagina: pagina + 1 })}
                label="Paginação de pessoas"
              />
            </>
          )}
        </CardContent>
      </Card>
      {alterando && (
        <DialogoSituacao
          pessoa={alterando}
          api={api}
          fechar={() => setAlterando(undefined)}
          concluido={() => {
            setMensagem(
              alterando.ativa
                ? "Pessoa inativada. O histórico foi preservado."
                : "Pessoa reativada e disponível nas operações futuras.",
            );
            setAlterando(undefined);
            setRevisao((valor) => valor + 1);
          }}
        />
      )}
    </section>
  );
}

function FormularioPessoa({ api, pessoa }: { api: Api; pessoa?: Pessoa }) {
  const navegar = useNavigate();
  const editando = !!pessoa;
  return (
    <section
      className="pagina-formulario-pessoa"
      aria-labelledby="titulo-formulario-pessoa"
    >
      <div className="cabecalho-interno">
        <p className="caminho-interno">
          <Link to="/pessoas">Pessoas</Link> /{" "}
          {editando ? "Editar" : "Novo cadastro"}
        </p>
        <h2 id="titulo-formulario-pessoa">
          {editando ? "Editar pessoa" : "Adicionar pessoa"}
        </h2>
        <p>
          {editando
            ? "Atualize somente os dados cadastrais necessários."
            : "Cadastre os dados básicos. A trajetória ER pode ser iniciada depois."}
        </p>
      </div>
      <Card>
        <CardContent>
          <Formulario
            key={pessoa?.versao ?? "nova"}
            titulo={editando ? "Dados da pessoa" : "Nova pessoa"}
            campos={camposPessoa}
            iniciais={pessoa?.dados}
            acoes={
              <Button asChild type="button" variant="outline">
                <Link to={pessoa ? `/pessoas/${pessoa.id}` : "/pessoas"}>
                  Cancelar
                </Link>
              </Button>
            }
            salvar={async (dados) => {
              if (pessoa) {
                await api(
                  `/pessoas/${pessoa.id}`,
                  { versao: pessoa.versao, dados: converter(dados) },
                  "PUT",
                );
                navegar(`/pessoas/${pessoa.id}`, {
                  state: { mensagem: "Dados da pessoa atualizados." },
                });
                return;
              }
              const criada = await api<components["schemas"]["IdResponse"]>(
                "/pessoas",
                converter(dados),
              );
              navegar(`/pessoas/${criada.id}`, {
                state: { mensagem: "Pessoa cadastrada com sucesso." },
              });
            }}
          />
        </CardContent>
      </Card>
      {pessoa && (
        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
            <CardDescription>PNG ou JPEG com até 2 MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <Formulario
              titulo="Atualizar foto"
              campos={[]}
              salvar={async () => {
                const elemento = document.getElementById(
                  `foto-${pessoa.id}`,
                ) as HTMLInputElement;
                if (!elemento.files?.[0])
                  throw new Error("Selecione uma foto PNG ou JPEG.");
                const form = new FormData();
                form.set("foto", elemento.files[0]);
                form.set("versao", pessoa.versao);
                await api(`/pessoas/${pessoa.id}/foto`, form);
              }}
            >
              <Label htmlFor={`foto-${pessoa.id}`}>
                Arquivo da foto
                <Input
                  id={`foto-${pessoa.id}`}
                  type="file"
                  accept="image/png,image/jpeg"
                  required
                />
              </Label>
            </Formulario>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function RotaEditarPessoa({ api }: { api: Api }) {
  const { pessoaId = "" } = useParams();
  const [revisao, setRevisao] = useState(0);
  const ficha = useConsulta<Pessoa>(api, `/pessoas/${pessoaId}`, revisao);
  return (
    <>
      <Estado {...ficha} atualizar={() => setRevisao((valor) => valor + 1)} />
      {ficha.dados && <FormularioPessoa api={api} pessoa={ficha.dados} />}
    </>
  );
}

function ResumoPessoa({ pessoa }: { pessoa: Pessoa }) {
  return (
    <div className="grade-resumo-pessoa">
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="lista-dados-pessoa">
            <dt>Nascimento</dt>
            <dd>{dataBr(pessoa.dados.dataNascimento)}</dd>
            <dt>Faixa etária atual</dt>
            <dd>
              {pessoa.faixaEtaria ?? "Fora da faixa etária ER ou não informada"}
            </dd>
            <dt>Naturalidade</dt>
            <dd>{pessoa.dados.naturalidade ?? "Não informada"}</dd>
            <dt>WhatsApp</dt>
            <dd>{pessoa.dados.whatsApp ?? "Não informado"}</dd>
            <dt>Endereço</dt>
            <dd>{pessoa.dados.endereco ?? "Não informado"}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vida eclesiástica e Embaixada</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="lista-dados-pessoa">
            <dt>Batismo</dt>
            <dd>
              {dataBr(pessoa.dados.dataBatismo)} ·{" "}
              {pessoa.dados.localBatismo ?? "Local não informado"}
            </dd>
            <dt>Primeira reunião</dt>
            <dd>
              {pessoa.primeiraReuniao
                ? dataBr(pessoa.primeiraReuniao)
                : "Nenhuma presença registrada"}
            </dd>
            <dt>Carteira</dt>
            <dd>
              {pessoa.dados.numeroCarteira ?? "Número não informado"} ·{" "}
              {pessoa.dados.situacaoCarteira ?? "Situação não informada"}
            </dd>
            <dt>Possui Bíblia</dt>
            <dd>
              {pessoa.dados.possuiBiblia == null
                ? "Não informado"
                : pessoa.dados.possuiBiblia
                  ? "Sim"
                  : "Não"}
            </dd>
          </dl>
        </CardContent>
      </Card>
      <Card className="cartao-observacoes-pessoa">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{pessoa.dados.observacoes ?? "Nenhuma observação cadastrada."}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FrequenciaPessoa({
  consulta,
  atualizar,
}: {
  consulta: { dados?: Frequencia[]; loading: boolean; erro: string };
  atualizar: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de frequência</CardTitle>
        <CardDescription>
          A primeira reunião é derivada da primeira presença registrada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Estado {...consulta} atualizar={atualizar} />
        {consulta.dados?.length === 0 && (
          <EmptyState
            title="Nenhuma frequência registrada"
            description="Os registros aparecerão aqui depois da chamada."
          />
        )}
        {consulta.dados && consulta.dados.length > 0 && (
          <Timeline
            label="Frequências da pessoa"
            items={consulta.dados.map((frequencia) => ({
              id: frequencia.reuniaoId,
              title: frequencia.titulo,
              description: estadosFrequencia[Number(frequencia.situacao) - 1],
              meta: dataBr(frequencia.data),
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

function VinculosPessoa({
  pessoa,
  api,
  editar,
  atualizar,
}: {
  pessoa: Pessoa;
  api: Api;
  editar: boolean;
  atualizar: () => void;
}) {
  return (
    <div className="grade-vinculos-pessoa">
      <Card>
        <CardHeader>
          <CardTitle>Responsáveis</CardTitle>
          <CardDescription>
            Contatos informados diretamente no cadastro do menino.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pessoa.responsaveis.length === 0 && (
            <EmptyState title="Nenhum responsável vinculado" />
          )}
          <ul className="lista-registros-pessoa">
            {pessoa.responsaveis.map((responsavel) => (
              <li key={responsavel.id}>
                <div>
                  <strong>
                    {responsavel.relacao}: {responsavel.nome}
                  </strong>
                  <span>
                    {responsavel.telefoneWhatsApp ?? "Contato não informado"} ·{" "}
                    {responsavel.moraComOEmbaixador == null
                      ? "Moradia não informada"
                      : responsavel.moraComOEmbaixador
                        ? "Mora com o Embaixador"
                        : "Não mora com o Embaixador"}
                  </span>
                </div>
                {editar && (
                  <details>
                    <summary>Editar</summary>
                    <Formulario
                      titulo={`Editar responsável ${responsavel.nome}`}
                      campos={[
                        {
                          nome: "relacao",
                          rotulo: "Relação",
                          obrigatorio: true,
                          limite: 80,
                        },
                        {
                          nome: "nome",
                          rotulo: "Nome",
                          obrigatorio: true,
                          limite: 200,
                        },
                        {
                          nome: "telefoneWhatsApp",
                          rotulo: "Telefone/WhatsApp",
                          limite: 40,
                        },
                        {
                          nome: "moraComOEmbaixador",
                          rotulo: "Mora com o Embaixador?",
                          tipo: "select",
                          opcoes: [
                            { valor: "true", rotulo: "Sim" },
                            { valor: "false", rotulo: "Não" },
                          ],
                        },
                      ]}
                      iniciais={{
                        ...responsavel,
                        moraComOEmbaixador:
                          responsavel.moraComOEmbaixador == null
                            ? ""
                            : String(responsavel.moraComOEmbaixador),
                      }}
                      salvar={async (dados) => {
                        await api(
                          `/pessoas/${pessoa.id}/responsaveis/${responsavel.id}`,
                          {
                            ...dados,
                            versao: responsavel.versao,
                            moraComOEmbaixador:
                              dados.moraComOEmbaixador === ""
                                ? null
                                : dados.moraComOEmbaixador === "true",
                          },
                          "PUT",
                        );
                        atualizar();
                      }}
                    />
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Remover ${responsavel.nome} dos responsáveis?`,
                          )
                        )
                          return;
                        await api(
                          `/pessoas/${pessoa.id}/responsaveis/${responsavel.id}?versao=${responsavel.versao}`,
                          {},
                          "DELETE",
                        );
                        atualizar();
                      }}
                    >
                      Remover responsável
                    </Button>
                  </details>
                )}
              </li>
            ))}
          </ul>
          {editar && pessoa.ativa && (
            <details>
              <summary>Adicionar responsável</summary>
              <Formulario
                titulo="Novo responsável"
                campos={[
                  {
                    nome: "relacao",
                    rotulo: "Relação",
                    obrigatorio: true,
                    limite: 80,
                  },
                  {
                    nome: "nome",
                    rotulo: "Nome",
                    obrigatorio: true,
                    limite: 200,
                  },
                  {
                    nome: "telefoneWhatsApp",
                    rotulo: "Telefone/WhatsApp",
                    limite: 40,
                  },
                  {
                    nome: "moraComOEmbaixador",
                    rotulo: "Mora com o Embaixador?",
                    tipo: "select",
                    opcoes: [
                      { valor: "true", rotulo: "Sim" },
                      { valor: "false", rotulo: "Não" },
                    ],
                  },
                ]}
                salvar={async (dados) => {
                  await api(`/pessoas/${pessoa.id}/responsaveis`, {
                    ...dados,
                    versaoPessoa: pessoa.versao,
                    moraComOEmbaixador:
                      dados.moraComOEmbaixador === ""
                        ? null
                        : dados.moraComOEmbaixador === "true",
                  });
                  atualizar();
                }}
              />
            </details>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vínculos eclesiásticos</CardTitle>
          <CardDescription>Histórico de membro ou congregado.</CardDescription>
        </CardHeader>
        <CardContent>
          {pessoa.vinculos.length === 0 && (
            <EmptyState title="Nenhum vínculo eclesiástico registrado" />
          )}
          <ul className="lista-registros-pessoa">
            {pessoa.vinculos.map((vinculo) => (
              <li key={vinculo.id}>
                <div>
                  <strong>
                    {vinculo.tipo} · {vinculo.nomeIgreja}
                  </strong>
                  <span>
                    {dataBr(vinculo.dataInicio)} até{" "}
                    {vinculo.dataFim ? dataBr(vinculo.dataFim) : "o momento"}
                  </span>
                </div>
                {editar && !vinculo.dataFim && (
                  <details>
                    <summary>Encerrar vínculo</summary>
                    <Formulario
                      titulo={`Encerrar vínculo com ${vinculo.nomeIgreja}`}
                      campos={[
                        {
                          nome: "dataFim",
                          rotulo: "Data de encerramento",
                          tipo: "date",
                          obrigatorio: true,
                        },
                      ]}
                      iniciais={{ dataFim: hoje() }}
                      salvar={async (dados) => {
                        await api(
                          `/pessoas/${pessoa.id}/vinculos-eclesiasticos/${vinculo.id}/encerramento`,
                          { ...dados, versao: vinculo.versao },
                        );
                        atualizar();
                      }}
                    />
                  </details>
                )}
              </li>
            ))}
          </ul>
          {editar && pessoa.ativa && (
            <details>
              <summary>Registrar vínculo eclesiástico</summary>
              <Formulario
                titulo="Novo vínculo eclesiástico"
                campos={[
                  {
                    nome: "nomeIgreja",
                    rotulo: "Igreja",
                    obrigatorio: true,
                  },
                  {
                    nome: "tipo",
                    rotulo: "Vínculo",
                    tipo: "select",
                    obrigatorio: true,
                    opcoes: [
                      { valor: "Membro", rotulo: "Membro" },
                      { valor: "Congregado", rotulo: "Congregado" },
                    ],
                  },
                  {
                    nome: "dataInicio",
                    rotulo: "Data de início",
                    tipo: "date",
                    obrigatorio: true,
                  },
                ]}
                iniciais={{ dataInicio: hoje() }}
                salvar={async (dados) => {
                  await api(`/pessoas/${pessoa.id}/vinculos-eclesiasticos`, {
                    ...dados,
                    versao: pessoa.versao,
                  });
                  atualizar();
                }}
              />
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoricoPessoa({
  pessoa,
  frequencias,
}: {
  pessoa: Pessoa;
  frequencias?: Frequencia[];
}) {
  const itens = useMemo(() => {
    const eventos: {
      id: string;
      data: string;
      title: string;
      description?: string;
    }[] = [];
    pessoa.alteracoesSituacao.forEach((alteracao) =>
      eventos.push({
        id: `situacao-${alteracao.registradoEm}`,
        data: alteracao.data,
        title: alteracao.tipo === 0 ? "Pessoa inativada" : "Pessoa reativada",
        description: alteracao.motivo,
      }),
    );
    pessoa.vinculos.forEach((vinculo) => {
      eventos.push({
        id: `igreja-inicio-${vinculo.id}`,
        data: vinculo.dataInicio,
        title: "Vínculo eclesiástico iniciado",
        description: `${vinculo.tipo} · ${vinculo.nomeIgreja}`,
      });
      if (vinculo.dataFim)
        eventos.push({
          id: `igreja-fim-${vinculo.id}`,
          data: vinculo.dataFim,
          title: "Vínculo eclesiástico encerrado",
          description: vinculo.nomeIgreja,
        });
    });
    frequencias?.forEach((frequencia) =>
      eventos.push({
        id: `frequencia-${frequencia.reuniaoId}`,
        data: frequencia.data,
        title: frequencia.titulo,
        description: estadosFrequencia[Number(frequencia.situacao) - 1],
      }),
    );
    return eventos
      .sort((a, b) => b.data.localeCompare(a.data))
      .map((evento) => ({ ...evento, meta: dataBr(evento.data) }));
  }, [frequencias, pessoa]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico cadastral e operacional</CardTitle>
        <CardDescription>
          Postos, tarefas e cerimônias permanecem detalhados em Jornada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <EmptyState title="Nenhum acontecimento registrado" />
        ) : (
          <Timeline items={itens} label="Histórico da pessoa" />
        )}
      </CardContent>
    </Card>
  );
}

function PessoaDetalhe({
  api,
  igrejaId,
  permissoes,
  pessoaId,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
  pessoaId: string;
}) {
  const [parametros, setParametros] = useSearchParams();
  const [revisao, setRevisao] = useState(0);
  const [alterando, setAlterando] = useState(false);
  const [mensagemSituacao, setMensagemSituacao] = useState("");
  const location = useLocation();
  const mensagem =
    (location.state as { mensagem?: string } | null)?.mensagem ??
    mensagemSituacao;
  const abaInformada = parametros.get("aba") as AbaPessoa | null;
  const ficha = useConsulta<Pessoa>(api, `/pessoas/${pessoaId}`, revisao);
  const podeConsultarFrequencia = permissoes.includes("frequencia.consultar");
  const frequencia = useConsulta<Frequencia[]>(
    api,
    podeConsultarFrequencia ? `/pessoas/${pessoaId}/frequencia` : null,
    revisao,
  );
  const editar = permissoes.includes("pessoas.editar");
  const atualizar = () => setRevisao((valor) => valor + 1);
  const pessoa = ficha.dados;
  const abasDisponiveis = pessoa
    ? abas.filter(
        (item) =>
          (item !== "jornada" || pessoa.possuiJornada) &&
          (!pessoa.conselheiroVigente ||
            !["frequencia", "vinculos"].includes(item)),
      )
    : abas;
  const aba =
    abaInformada && abasDisponiveis.includes(abaInformada)
      ? abaInformada
      : "resumo";
  function selecionarAba(valor: string) {
    const proximos = new URLSearchParams(parametros);
    if (valor === "resumo") proximos.delete("aba");
    else proximos.set("aba", valor);
    setParametros(proximos, { replace: true });
  }
  return (
    <section className="pagina-detalhe-pessoa">
      <Estado {...ficha} atualizar={atualizar} />
      {mensagem && (
        <Alert variant="success">
          <AlertDescription>{mensagem}</AlertDescription>
        </Alert>
      )}
      {pessoa && (
        <>
          <div className="resumo-superior-pessoa">
            <Foto igrejaId={igrejaId} pessoa={pessoa} />
            <div className="identificacao-pessoa">
              <p className="caminho-interno">
                <Link to="/pessoas">Pessoas</Link> / Detalhes
              </p>
              <h2>{pessoa.dados.nome}</h2>
              <div>
                <Badge variant={pessoa.ativa ? "success" : "neutral"}>
                  {pessoa.ativa ? "Ativa" : "Inativa"}
                </Badge>
                {pessoa.faixaEtaria && <Badge>{pessoa.faixaEtaria}</Badge>}
              </div>
            </div>
            <div className="acoes-detalhe-pessoa">
              {editar && (
                <Button asChild>
                  <Link to={`/pessoas/${pessoa.id}/editar`}>Editar pessoa</Link>
                </Button>
              )}
              {editar && (
                <Button
                  variant={pessoa.ativa ? "outline" : "secondary"}
                  onClick={() => setAlterando(true)}
                >
                  {pessoa.ativa ? "Inativar" : "Reativar"}
                </Button>
              )}
            </div>
          </div>
          {!pessoa.ativa && (
            <Alert variant="warning">
              <AlertDescription>
                Esta pessoa está inativa e não aparece nas operações futuras. O
                histórico permanece disponível.
              </AlertDescription>
            </Alert>
          )}
          {!pessoa.possuiJornada &&
            !pessoa.conselheiroVigente &&
            pessoa.ativa &&
            permissoes.includes("progressao.registrar") && (
              <Card>
                <CardHeader>
                  <CardTitle>Visitante</CardTitle>
                  <CardDescription>
                    A Jornada ainda não se aplica. Registre a candidatura quando
                    o menino se tornar Candidato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Formulario
                    titulo="Registrar como Candidato"
                    campos={[]}
                    texto="Iniciar trajetória"
                    salvar={async () => {
                      await api(`/pessoas/${pessoa.id}/candidatura`, {
                        versao: pessoa.versao,
                      });
                      atualizar();
                    }}
                  />
                </CardContent>
              </Card>
            )}
          <Tabs value={aba} onValueChange={selecionarAba}>
            <TabsList aria-label="Áreas da ficha da pessoa">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              {pessoa.possuiJornada && (
                <TabsTrigger value="jornada">
                  {pessoa.conselheiroVigente
                    ? "Trajetória ER histórica"
                    : "Jornada"}
                </TabsTrigger>
              )}
              {!pessoa.conselheiroVigente && (
                <TabsTrigger value="frequencia">Frequência</TabsTrigger>
              )}
              {!pessoa.conselheiroVigente && (
                <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
              )}
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo">
              <ResumoPessoa pessoa={pessoa} />
            </TabsContent>
            <TabsContent value="jornada">
              {permissoes.includes("progressao.consultar") ? (
                <Jornada
                  api={api}
                  pessoaId={pessoa.id}
                  versaoPessoa={pessoa.versao}
                  podeRegistrar={
                    pessoa.ativa &&
                    !pessoa.conselheiroVigente &&
                    permissoes.includes("progressao.registrar")
                  }
                  atualizarPessoa={atualizar}
                />
              ) : (
                <AccessDeniedState description="Você não possui permissão para consultar a Jornada." />
              )}
            </TabsContent>
            <TabsContent value="frequencia">
              {podeConsultarFrequencia ? (
                <FrequenciaPessoa consulta={frequencia} atualizar={atualizar} />
              ) : (
                <AccessDeniedState description="Você não possui permissão para consultar a frequência." />
              )}
            </TabsContent>
            <TabsContent value="vinculos">
              <VinculosPessoa
                pessoa={pessoa}
                api={api}
                editar={editar}
                atualizar={atualizar}
              />
            </TabsContent>
            <TabsContent value="historico">
              <HistoricoPessoa pessoa={pessoa} frequencias={frequencia.dados} />
            </TabsContent>
          </Tabs>
        </>
      )}
      {alterando && pessoa && (
        <DialogoSituacao
          pessoa={pessoa}
          api={api}
          fechar={() => setAlterando(false)}
          concluido={() => {
            setMensagemSituacao(
              pessoa.ativa
                ? "Pessoa inativada. O histórico foi preservado."
                : "Pessoa reativada e disponível nas operações futuras.",
            );
            setAlterando(false);
            atualizar();
          }}
        />
      )}
    </section>
  );
}

function RotaPessoa({
  api,
  igrejaId,
  permissoes,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
}) {
  const { pessoaId = "" } = useParams();
  return (
    <PessoaDetalhe
      api={api}
      igrejaId={igrejaId}
      permissoes={permissoes}
      pessoaId={pessoaId}
    />
  );
}

export function Pessoas({
  api,
  igrejaId,
  permissoes,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
}) {
  const editar = permissoes.includes("pessoas.editar");
  return (
    <Routes>
      <Route index element={<ListaPessoas api={api} editar={editar} />} />
      <Route
        path="nova"
        element={
          editar ? (
            <FormularioPessoa api={api} />
          ) : (
            <Navigate to="/pessoas" replace />
          )
        }
      />
      <Route
        path=":pessoaId/editar"
        element={
          editar ? <RotaEditarPessoa api={api} /> : <Navigate to=".." replace />
        }
      />
      <Route
        path=":pessoaId"
        element={
          <RotaPessoa api={api} igrejaId={igrejaId} permissoes={permissoes} />
        }
      />
      <Route path="*" element={<Navigate to="/pessoas" replace />} />
    </Routes>
  );
}
