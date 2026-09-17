import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { type Api, useConsulta } from "./api";
import type { components } from "../../../../packages/contracts/api";

export type Campo = {
  nome: string;
  rotulo: string;
  tipo?: "date" | "time" | "number" | "textarea" | "select" | "text";
  obrigatorio?: boolean;
  limite?: number;
  opcoes?: { valor: string; rotulo: string }[];
  grupo?: string;
};
export function Formulario({
  titulo,
  campos,
  iniciais = {},
  salvar,
  children,
  texto = "Salvar",
  acoes,
}: {
  titulo: string;
  campos: Campo[];
  iniciais?: Record<string, unknown>;
  salvar: (dados: Record<string, string>) => Promise<unknown>;
  children?: ReactNode;
  texto?: string;
  acoes?: ReactNode;
}) {
  const id = useId();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const mensagem = useRef<HTMLParagraphElement>(null);
  const grupos = campos.reduce<Record<string, Campo[]>>((resultado, campo) => {
    const grupo = campo.grupo ?? "";
    (resultado[grupo] ??= []).push(campo);
    return resultado;
  }, {});
  const renderizarCampo = (c: Campo) => (
    <label key={c.nome} htmlFor={`${id}-${c.nome}`}>
      {c.rotulo}
      {c.obrigatorio && " *"}
      {c.tipo === "textarea" ? (
        <textarea
          id={`${id}-${c.nome}`}
          name={c.nome}
          required={c.obrigatorio}
          maxLength={c.limite ?? 10000}
          rows={4}
          defaultValue={String(iniciais[c.nome] ?? "")}
        />
      ) : c.tipo === "select" ? (
        <select
          id={`${id}-${c.nome}`}
          name={c.nome}
          required={c.obrigatorio}
          defaultValue={String(iniciais[c.nome] ?? "")}
        >
          <option value="">Selecione</option>
          {c.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`${id}-${c.nome}`}
          name={c.nome}
          type={c.tipo ?? "text"}
          step={c.tipo === "number" ? "any" : undefined}
          required={c.obrigatorio}
          maxLength={c.limite ?? 200}
          defaultValue={String(iniciais[c.nome] ?? "")}
        />
      )}
    </label>
  );
  return (
    <form
      aria-label={titulo}
      className="formulario-dominio"
      onInput={() => {
        if (erro) setErro("");
        if (sucesso) setSucesso(false);
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        const dados = Object.fromEntries(
          new FormData(e.currentTarget),
        ) as Record<string, string>;
        setErro("");
        setSucesso(false);
        setSalvando(true);
        try {
          await salvar(dados);
          setSucesso(true);
        } catch (e) {
          setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
          requestAnimationFrame(() => mensagem.current?.focus());
        } finally {
          setSalvando(false);
        }
      }}
    >
      <fieldset disabled={salvando}>
        <legend>{titulo}</legend>
        <div className="campos-dominio">
          {Object.entries(grupos).map(([grupo, itens]) =>
            grupo ? (
              <section className="grupo-campos" key={grupo}>
                <h3>{grupo}</h3>
                <div>{itens.map(renderizarCampo)}</div>
              </section>
            ) : (
              itens.map(renderizarCampo)
            ),
          )}
          {children}
        </div>
        <div className="acoes-formulario">
          <Button type="submit">{salvando ? "Salvando…" : texto}</Button>
          {acoes}
        </div>
      </fieldset>
      {erro && (
        <p ref={mensagem} role="alert" tabIndex={-1}>
          {erro}
        </p>
      )}
      {sucesso && (
        <p role="status" aria-live="polite">
          Registro salvo.
        </p>
      )}
    </form>
  );
}

export function FormularioDialogo({
  titulo,
  descricao,
  gatilho,
  children,
}: {
  titulo: string;
  descricao: string;
  gatilho: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{gatilho}</Button>
      </DialogTrigger>
      <DialogContent className="dialogo-formulario">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Estado({
  loading,
  erro,
  atualizar,
}: {
  loading: boolean;
  erro: string;
  atualizar: () => void;
}) {
  return (
    <>
      {loading && <p role="status">Carregando…</p>}
      {erro && (
        <div role="alert">
          <p>{erro}</p>
          <Button onClick={atualizar}>Tentar novamente</Button>
        </div>
      )}
    </>
  );
}

export function EstadoConsultas({
  consultas,
  atualizar,
}: {
  consultas: { loading: boolean; erro: string }[];
  atualizar: () => void;
}) {
  return (
    <Estado
      loading={consultas.some((x) => x.loading)}
      erro={consultas.map((x) => x.erro).find(Boolean) ?? ""}
      atualizar={atualizar}
    />
  );
}
export function SeletorPessoa({
  api,
  nome = "pessoaId",
  rotulo = "Pessoa",
  obrigatorio = true,
  valorInicial = "",
}: {
  api: Api;
  nome?: string;
  rotulo?: string;
  obrigatorio?: boolean;
  valorInicial?: string;
}) {
  const id = useId();
  const [busca, setBusca] = useState("");
  const [revisao, setRevisao] = useState(0);
  const lista = useConsulta<components["schemas"]["PessoasResponse"]>(
    api,
    `/pessoas?busca=${encodeURIComponent(busca)}`,
    revisao,
  );
  return (
    <div>
      <label htmlFor={`${id}-busca`}>
        Buscar {rotulo.toLowerCase()}
        <input
          id={`${id}-busca`}
          value={busca}
          maxLength={100}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>
      <Estado {...lista} atualizar={() => setRevisao((r) => r + 1)} />
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && " *"}
        <select
          id={id}
          name={nome}
          required={obrigatorio}
          defaultValue={valorInicial}
        >
          <option value="">Selecione uma pessoa cadastrada</option>
          {valorInicial &&
            !lista.dados?.pessoas.some((p) => p.id === valorInicial) && (
              <option value={valorInicial}>Pessoa atualmente vinculada</option>
            )}
          {lista.dados?.pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {lista.dados?.total === 0 && (
        <p>Nenhuma pessoa encontrada. Cadastre-a primeiro.</p>
      )}
    </div>
  );
}
