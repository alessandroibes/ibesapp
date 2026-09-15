import { useEffect, useState } from "react";

export type Api = <T>(
  caminho: string,
  dados?: unknown,
  metodo?: string,
  signal?: AbortSignal,
) => Promise<T>;
export function criarApi(igrejaId: string): Api {
  return async <T>(
    caminho: string,
    dados?: unknown,
    metodo = "POST",
    signal?: AbortSignal,
  ): Promise<T> => {
    const headers: Record<string, string> = { "X-Igreja-Id": igrejaId };
    let body: BodyInit | undefined;
    if (dados !== undefined) {
      const csrf = await fetch("/bff/csrf", { signal });
      if (!csrf.ok) throw new Error("Sua sessão expirou. Entre novamente.");
      headers["X-CSRF-TOKEN"] = (
        (await csrf.json()) as { token: string }
      ).token;
      if (dados instanceof FormData) body = dados;
      else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(dados);
      }
    }
    const response = await fetch(`/api/v1${caminho}`, {
      method: dados === undefined ? "GET" : metodo,
      headers,
      body,
      signal,
    });
    if (!response.ok) {
      if (response.status === 401)
        throw new Error("Sua sessão expirou. Entre novamente.");
      if (response.status === 403)
        throw new Error(
          "Você não tem permissão para esta operação. Registros de progressão também exigem vínculo de Conselheiro ativo.",
        );
      if (response.status === 404)
        throw new Error("Registro não encontrado na Igreja selecionada.");
      if (response.status === 409)
        throw new Error(
          "O registro mudou ou já existe. Atualize os dados antes de tentar novamente.",
        );
      const erro = (await response.json().catch(() => null)) as {
        title?: string;
        errors?: Record<string, string[]>;
      } | null;
      throw new Error(
        erro?.errors
          ? Object.values(erro.errors).flat().join(" ")
          : (erro?.title ?? "Não foi possível concluir a operação."),
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };
}
export function useConsulta<T>(api: Api, caminho: string | null, revisao = 0) {
  const [dados, setDados] = useState<T>();
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setDados(undefined);
    setErro("");
    setLoading(!!caminho);
    if (caminho)
      api<T>(caminho, undefined, undefined, controller.signal)
        .then((d) => {
          if (!controller.signal.aborted) setDados(d);
        })
        .catch((e: Error) => {
          if (!controller.signal.aborted) setErro(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    return () => controller.abort();
  }, [api, caminho, revisao]);
  return { dados, erro, loading };
}
export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dataBr(data?: string | null) {
  return data
    ? data.slice(0, 10).split("-").reverse().join("/")
    : "Não informado";
}
