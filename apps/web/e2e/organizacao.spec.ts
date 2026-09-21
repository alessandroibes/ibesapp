import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Consulado, Cônsul, transferência e mandato", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const sufixo = Date.now();
  const anoMandato = 3000 + (sufixo % 900);
  const pessoaNome = `Membro Consulado ${sufixo}`;
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  const pessoa = page.getByRole("form", { name: "Nova pessoa" });
  await pessoa.getByLabel("Nome completo").fill(pessoaNome);
  await pessoa.getByLabel("Data de nascimento").fill("2011-01-01");
  await pessoa.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "Iniciar trajetória" }).click();
  await page.getByRole("link", { name: "Consulados e Diretoria" }).click();
  for (const nome of [`Origem ${sufixo}`, `Destino ${sufixo}`]) {
    await page.getByRole("button", { name: "Novo Consulado" }).click();
    const form = page.getByRole("form", { name: "Novo Consulado" });
    await form.getByLabel("Nome do Consulado").fill(nome);
    await form.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  }
  await page
    .locator("section.ds-card")
    .filter({ has: page.getByRole("heading", { name: `Origem ${sufixo}` }) })
    .getByRole("link", { name: "Ver detalhes" })
    .click();
  await page.getByRole("button", { name: "Incluir membro" }).click();
  const incluir = page.getByRole("form", {
    name: new RegExp("Incluir membro em"),
  });
  await incluir.getByLabel("Buscar candidato ou embaixador").fill(pessoaNome);
  await incluir
    .getByRole("combobox", { name: /^Candidato ou Embaixador/ })
    .selectOption({ label: pessoaNome });
  await incluir.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(pessoaNome, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Definir Cônsul" }).click();
  const consul = page.getByRole("form", { name: new RegExp("Definir Cônsul") });
  await consul.getByLabel("Membro vigente").selectOption({ label: pessoaNome });
  await consul.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.locator(".destaque-pessoa").getByText(pessoaNome, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Transferir" }).click();
  const transferencia = page.getByRole("form", {
    name: `Transferir ${pessoaNome}`,
  });
  await transferencia
    .getByLabel("Consulado de destino")
    .selectOption({ label: `Destino ${sufixo}` });
  await transferencia
    .getByRole("button", { name: "Confirmar transferência" })
    .click();
  await expect(page.getByText(`${pessoaNome} · membro`)).toBeVisible();
  await page.getByRole("link", { name: "Diretoria e mandatos" }).click();
  await page.getByRole("button", { name: "Novo mandato" }).click();
  const mandato = page.getByRole("form", {
    name: "Criar mandato da Diretoria",
  });
  await mandato.getByLabel("Nome do mandato").fill(`Mandato E2E ${sufixo}`);
  await mandato.getByLabel("Início").fill(`${anoMandato}-01-01`);
  await mandato.getByLabel("Fim").fill(`${anoMandato}-12-31`);
  await mandato.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByRole("heading", { name: `Mandato E2E ${sufixo}` }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver mandato" }).last().click();
  await expect(
    page.getByRole("heading", { name: `Mandato E2E ${sufixo}` }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
