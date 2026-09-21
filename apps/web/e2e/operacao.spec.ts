import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(60_000);

async function semViolacoes(page: import("@playwright/test").Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test("agenda, recorrência, exceção, visitante, chamada e cancelamento", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("link", { name: "Agenda e reuniões", exact: true })
    .click();
  await semViolacoes(page);

  const sufixo = Date.now();
  const titulo = "Reunião E2E " + sufixo;
  const visitante = "Visitante E2E " + sufixo;
  const nomePromotora = "Promotora " + sufixo;
  const nomeTipo = "Tipo " + sufixo;

  await page.getByRole("link", { name: "Configurações" }).click();
  await page.getByRole("tab", { name: "Promotoras" }).click();
  const promotora = page.getByRole("form", { name: "Nova entidade promotora" });
  await promotora.getByLabel("Nome da promotora").fill(nomePromotora);
  await promotora.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(nomePromotora, { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Tipos" }).click();
  const tipo = page.getByRole("form", { name: "Novo tipo de atividade" });
  await tipo.getByLabel("Nome do tipo").fill(nomeTipo);
  await tipo.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(nomeTipo, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Voltar à agenda" }).click();

  await page.getByRole("link", { name: "Nova atividade" }).click();
  await semViolacoes(page);
  const atividade = page.getByRole("form", {
    name: "Nova atividade",
    exact: true,
  });
  await atividade.getByLabel("Título da atividade").fill(titulo);
  await atividade
    .getByLabel("Tipo de atividade")
    .selectOption({ label: nomeTipo });
  await atividade
    .getByLabel("Entidade promotora")
    .selectOption({ label: nomePromotora });
  await atividade.getByLabel("Data inicial").fill("2024-06-01");
  await atividade.getByLabel("Data final").fill("2024-06-01");
  await atividade
    .locator('select[name="periodicidade"]')
    .selectOption({ label: "Semanal" });
  await atividade.locator('input[name="diasSemana"]').fill("6");
  await atividade.getByLabel("Repetir até (opcional)").fill("2024-06-15");
  await atividade.getByRole("button", { name: "Salvar" }).click();

  await expect(
    page.getByRole("heading", { name: titulo, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Recorrente", { exact: true })).toBeVisible();
  await semViolacoes(page);
  const ocorrenciaUrl = page.url();
  await page
    .getByRole("button", { name: "Criar reunião", exact: true })
    .click();
  await expect(page.getByText("Chamada aberta", { exact: true })).toBeVisible();
  await semViolacoes(page);

  const novoVisitante = page.getByRole("form", { name: "Novo visitante" });
  await novoVisitante.getByLabel("Nome do visitante").fill(visitante);
  await novoVisitante.getByRole("button", { name: "Salvar" }).click();
  const grupo = page.getByRole("group", { name: "Frequência de " + visitante });
  await grupo
    .getByRole("button", { name: "Presença com Atraso", exact: true })
    .click();
  await expect(
    grupo.getByRole("button", { name: "Presença com Atraso", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.goto(ocorrenciaUrl);
  await page.getByRole("tab", { name: "Ocorrência" }).click();
  const excecao = page.getByRole("form", { name: "Exceção da ocorrência" });
  await excecao.getByLabel("Nova situação").selectOption("4");
  await excecao.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByText(/permanece visível como histórico/),
  ).toBeVisible();

  await page.getByRole("link", { name: "Voltar à agenda" }).click();
  await page.getByLabel("Data de referência").fill("2024-06-01");
  await expect(page.getByText(/compromissos/).first()).toBeVisible();
  await page.getByRole("button", { name: "Ano" }).click();
  await expect(page.getByLabel("Cronograma anual")).toBeVisible();
  await page.getByRole("button", { name: "Mês", exact: true }).click();
  await expect(page.getByLabel("Calendário mensal")).toBeVisible();
  await semViolacoes(page);
  await page.screenshot({
    path: "../../artifacts/agenda-desktop.png",
    fullPage: true,
  });

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.screenshot({
    path: "../../artifacts/operacao-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Áreas de trabalho" }).click();
  await page
    .getByRole("link", { name: "Meninos e jornada", exact: true })
    .click();
  await page.getByLabel("Buscar pelo nome").fill(visitante);
  await page
    .getByRole("row", { name: new RegExp(visitante) })
    .getByRole("link", { name: "Visualizar" })
    .click();
  await expect(
    page.locator("dt", { hasText: "Primeira reunião" }).locator("+ dd"),
  ).toHaveText("01/06/2024");
});
