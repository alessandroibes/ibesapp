import { useId, useState, type ReactNode } from "react";
import { Button } from "../components/ui/button";
import { type Api, useConsulta } from "./api";
import type { components } from "../../../../packages/contracts/api";

export type Campo = {
  nome: string;
  rotulo: string;
  tipo?: "date" | "textarea" | "select" | "text";
  obrigatorio?: boolean;
  limite?: number;
  opcoes?: { valor: string; rotulo: string }[];
};
export function Formulario({
  titulo,
  campos,
  iniciais = {},
  salvar,
  children,
  texto = "Salvar",
}: {
  titulo: string;
  campos: Campo[];
  iniciais?: Record<string, unknown>;
  salvar: (dados: Record<string, string>) => Promise<unknown>;
  children?: ReactNode;
  texto?: string;
}) {
  const id = useId();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  return (
    <form
      aria-label={titulo}
      className="formulario-dominio"
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
        } finally {
          setSalvando(false);
        }
      }}
    >
      <fieldset disabled={salvando}>
        <legend>{titulo}</legend>
        <div className="campos-dominio">
          {campos.map((c) => (
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
                  required={c.obrigatorio}
                  maxLength={c.limite ?? 200}
                  defaultValue={String(iniciais[c.nome] ?? "")}
                />
              )}
            </label>
          ))}
          {children}
        </div>
        <Button type="submit">{salvando ? "Salvando…" : texto}</Button>
      </fieldset>
      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">Registro salvo.</p>}
    </form>
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
export function SeletorPessoa({
  api,
  nome = "pessoaId",
  rotulo = "Pessoa",
}: {
  api: Api;
  nome?: string;
  rotulo?: string;
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
        {rotulo} *
        <select id={id} name={nome} required defaultValue="">
          <option value="">Selecione uma pessoa cadastrada</option>
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
