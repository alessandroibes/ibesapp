import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { App } from "./App";
describe("Shell web", () => {
  it("oferece acesso quando não autenticado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    render(<App />);
    expect(
      await screen.findByRole("link", { name: /Entrar na minha conta/ }),
    ).toHaveAttribute("href", "/conta/entrar");
  });
  it("mostra estado vazio sem inventar dados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ igrejas: [] })),
    );
    render(<App />);
    expect(
      await screen.findByText(/ainda não possui vínculo/),
    ).toBeInTheDocument();
  });
  it("permite recuperar falha de rede", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );
    expect(
      await screen.findByRole("link", { name: /Entrar na minha conta/ }),
    ).toBeInTheDocument();
  });
  it("seleciona Igreja e envia o identificador no contexto", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          igrejas: [
            { igrejaId: "a", nome: "Igreja A" },
            { igrejaId: "b", nome: "Igreja B" },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          igrejaId: "a",
          igreja: "Igreja A",
          embaixada: "Embaixada A",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          igrejaId: "b",
          igreja: "Igreja B",
          embaixada: "Embaixada B",
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await screen.findByText("Embaixada A");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Igreja" }),
      "b",
    );
    await waitFor(() =>
      expect(screen.queryByText("Embaixada A")).not.toBeInTheDocument(),
    );
    expect(await screen.findByText("Embaixada B")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(
      "/api/v1/contexto",
      expect.objectContaining({ headers: { "X-Igreja-Id": "b" } }),
    );
  });
});
