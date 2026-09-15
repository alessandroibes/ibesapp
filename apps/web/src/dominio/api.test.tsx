import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type Api, useConsulta } from "./api";

describe("consultas de domínio", () => {
  it("preserva conteúdo durante atualização e limpa ao trocar a Igreja", async () => {
    let resolver!: (valor: string[]) => void;
    const apiA = vi
      .fn()
      .mockResolvedValueOnce(["Pessoa A"])
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((r) => {
            resolver = r;
          }),
      ) as unknown as Api;
    const apiB = vi
      .fn()
      .mockImplementation(() => new Promise(() => {})) as unknown as Api;
    const h = renderHook(
      ({ api, revisao }) => useConsulta<string[]>(api, "/pessoas", revisao),
      { initialProps: { api: apiA, revisao: 0 } },
    );
    await waitFor(() => expect(h.result.current.dados).toEqual(["Pessoa A"]));
    h.rerender({ api: apiA, revisao: 1 });
    expect(h.result.current.dados).toEqual(["Pessoa A"]);
    await act(async () => resolver(["Pessoa A atualizada"]));
    expect(h.result.current.dados).toEqual(["Pessoa A atualizada"]);
    h.rerender({ api: apiB, revisao: 1 });
    expect(h.result.current.dados).toBeUndefined();
  });
  it("remove conteúdo se a atualização perde autorização", async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce(["Registro"])
      .mockRejectedValueOnce(new Error("Sem permissão")) as unknown as Api;
    const h = renderHook(
      ({ revisao }) => useConsulta<string[]>(api, "/agenda", revisao),
      { initialProps: { revisao: 0 } },
    );
    await waitFor(() => expect(h.result.current.dados).toEqual(["Registro"]));
    h.rerender({ revisao: 1 });
    await waitFor(() => expect(h.result.current.erro).toBe("Sem permissão"));
    expect(h.result.current.dados).toBeUndefined();
  });
});
