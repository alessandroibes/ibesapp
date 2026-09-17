import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test("aptidão, elegibilidade, escalação, finalização e reabertura", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await entrar(page);
  const sufixo = Date.now();
  const nome = `Competidor E2E ${sufixo}`;
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  await page
    .getByRole("form", { name: "Nova pessoa" })
    .getByLabel("Nome completo")
    .fill(nome);
  await page
    .getByRole("form", { name: "Nova pessoa" })
    .getByLabel("Data de nascimento")
    .fill("2010-01-01");
  await page
    .getByRole("form", { name: "Nova pessoa" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await page.getByRole("tab", { name: "Jornada" }).click();
  await page.getByRole("button", { name: "Iniciar trajetória" }).click();

  await page
    .getByRole("navigation", { name: "Gestão da Embaixada" })
    .getByRole("link", { name: "Competições", exact: true })
    .click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: "Catálogo de provas" }).click();
  const modalidadeNome = `Natação E2E ${sufixo}`;
  const provaNome = `Revezamento E2E ${sufixo}`;
  await page.getByRole("button", { name: "Nova modalidade" }).click();
  await page
    .getByRole("form", { name: "Nova modalidade" })
    .getByLabel("Nome da modalidade")
    .fill(modalidadeNome);
  await page
    .getByRole("form", { name: "Nova modalidade" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await expect(page.getByText("Registro salvo.")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await page.getByRole("button", { name: "Nova prova" }).click();
  const prova = page.getByRole("form", { name: "Nova prova" });
  await prova.getByLabel("Modalidade").selectOption({ label: modalidadeNome });
  await prova.getByLabel("Nome da prova").fill(provaNome);
  await prova.getByLabel("Natureza").selectOption({ label: "Coletiva" });
  await prova
    .getByLabel("Referência variável")
    .selectOption({ label: "Nenhuma" });
  await prova.getByRole("button", { name: "Salvar" }).click();
  await expect(prova.getByText("Registro salvo.")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("link", { name: "Aptidões" }).click();
  await page.getByRole("button", { name: "Registrar aptidão" }).click();
  const aptidao = page.getByRole("form", { name: "Registrar aptidão" });
  await aptidao
    .getByLabel("Prova")
    .selectOption({ label: `${modalidadeNome} · ${provaNome}` });
  await aptidao.getByLabel("Buscar candidato ou embaixador").fill(nome);
  await aptidao
    .getByRole("combobox", { name: /^Candidato ou Embaixador/ })
    .selectOption({ label: nome });
  await aptidao.getByRole("button", { name: "Salvar" }).click();
  await expect(aptidao.getByText("Registro salvo.")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page
    .getByRole("navigation", { name: "Competições" })
    .getByRole("link", { name: "Competições", exact: true })
    .click();
  await page.getByRole("link", { name: "Nova competição" }).click();
  const competicaoNome = `Jogos E2E ${sufixo}`;
  const competicao = page.getByRole("form", { name: "Nova competição" });
  await competicao.getByLabel("Nome da competição").fill(competicaoNome);
  await competicao.getByLabel("Data inicial").fill("2026-10-01");
  await competicao.getByLabel("Data final").fill("2026-10-01");
  await competicao.getByLabel("Data-base das categorias").fill("2026-01-01");
  await competicao.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("link", { name: "Ver competição" }).last().click();
  await page.getByRole("button", { name: "Adicionar prova" }).click();
  const configurar = page.getByRole("form", {
    name: "Adicionar prova à competição",
  });
  await configurar
    .getByLabel("Prova do catálogo")
    .selectOption({ label: `${modalidadeNome} · ${provaNome}` });
  await configurar.getByLabel("Categorias").selectOption({ label: "Livre" });
  await configurar.getByLabel("Mínimo de titulares").fill("1");
  await configurar.getByLabel("Máximo total, incluindo reservas").fill("2");
  await configurar.getByLabel("Máximo de reservas").fill("1");
  await configurar.getByRole("button", { name: "Salvar" }).click();
  const funcao = page.getByLabel(`Função de ${nome}`).last();
  const cartaoProva = page
    .getByRole("heading", { name: `${modalidadeNome} · ${provaNome}` })
    .last()
    .locator("xpath=ancestor::section[contains(@class,'ds-card')][1]");
  await funcao.selectOption({ label: "Titular" });
  await cartaoProva.getByRole("button", { name: "Salvar escalação" }).click();
  await expect(
    cartaoProva.getByRole("heading", { name: "Titulares (1)" }),
  ).toBeVisible();
  await cartaoProva
    .getByRole("button", { name: "Finalizar escalação" })
    .click();
  await page.getByRole("button", { name: "Confirmar finalização" }).click();
  await expect(
    cartaoProva.getByText("Finalizada", { exact: true }),
  ).toBeVisible();
  await cartaoProva.getByRole("button", { name: "Reabrir escalação" }).click();
  const motivo = page.getByLabel("Motivo da reabertura");
  await motivo.fill("Ajuste E2E");
  await motivo.press("Enter");
  await expect(
    cartaoProva.getByText("Rascunho", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Reaberta.*Ajuste E2E/).last()).toBeVisible();
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
