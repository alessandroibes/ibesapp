import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("controle financeiro e linha do tempo histórica", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  const sufixo = Date.now();
  const iniciativaNome = `Camisas E2E ${sufixo}`;
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await page.getByRole("button", { name: "Nova iniciativa" }).click();
  const iniciativa = page.getByRole("form", { name: "Dados da iniciativa" });
  await iniciativa.getByLabel("Nome").fill(iniciativaNome);
  await iniciativa.getByRole("button", { name: "Salvar" }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Novo lançamento" }).click();
  const lancamento = page.getByRole("form", { name: "Dados do lançamento" });
  await lancamento
    .getByLabel("Movimentação")
    .selectOption({ label: "Entrada" });
  await lancamento.getByLabel("Data").fill("2026-09-16");
  await lancamento.getByLabel("Valor (R$)").fill("75.50");
  await lancamento.getByLabel("Motivo").fill("Pagamento de camisa");
  await lancamento
    .getByLabel("Iniciativa")
    .selectOption({ label: iniciativaNome });
  await lancamento
    .getByRole("button", { name: "Registrar lançamento" })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("16/09/2026 · Pagamento de camisa").first(),
  ).toBeVisible();
  await expect(page.getByText(/R\$\s*75,50/).first()).toBeVisible();

  await page
    .getByRole("link", { name: "Acervo histórico", exact: true })
    .click();
  await page.getByRole("link", { name: "Novo marco" }).click();
  const titulo = `Acampamento E2E ${sufixo}`;
  const marco = page.getByRole("form", { name: "Dados do marco" });
  await marco.getByLabel("Data inicial").fill("2026-09-16");
  await marco.getByLabel("Título").fill(titulo);
  await marco.getByLabel("Categoria").selectOption({ label: "Acampamento" });
  await marco.getByLabel("Descrição").fill("Memória histórica do acampamento.");
  await marco.getByRole("button", { name: "Registrar marco" }).click();
  const artigo = page.getByRole("article").filter({ hasText: titulo });
  await expect(artigo).toBeVisible();
  await artigo.getByRole("button", { name: "Ver detalhes" }).click();
  await page.getByRole("button", { name: "Adicionar anexo" }).click();
  const anexo = page.getByRole("form", { name: "Anexar foto ou documento" });
  await anexo.getByLabel("Arquivo").setInputFiles({
    name: "memoria.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nmemoria"),
  });
  await anexo.getByRole("button", { name: "Enviar anexo" }).click();
  await expect(page.getByRole("button", { name: "Baixar" })).toBeVisible();

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  for (const largura of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width: largura, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
