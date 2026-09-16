import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("agenda, visitante, chamada e primeira reunião preservada após cancelamento", async ({
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
  const sufixo = Date.now();
  const titulo = `Reunião E2E ${sufixo}`;
  const visitante = `Visitante E2E ${sufixo}`;
  await page.getByText("Tipos e entidades promotoras", { exact: true }).click();
  const p = page.getByRole("form", { name: "Nova entidade promotora" });
  await p.getByLabel("Nome da promotora").fill(`Promotora ${sufixo}`);
  await p.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page
      .getByLabel("Filtrar por promotora")
      .locator("option", { hasText: `Promotora ${sufixo}` }),
  ).toHaveCount(1);
  const t = page.getByRole("form", { name: "Novo tipo de atividade" });
  await t.getByLabel("Nome do tipo").fill(`Tipo ${sufixo}`);
  await t.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page
      .getByLabel("Filtrar por tipo")
      .locator("option", { hasText: `Tipo ${sufixo}` }),
  ).toHaveCount(1);
  await page.getByLabel("Data de referência").fill("2024-06-01");
  await page.getByLabel("Visualização").selectOption("hoje");
  await page.getByText("Cadastrar atividade ou prazo", { exact: true }).click();
  const a = page.getByRole("form", { name: "Nova atividade", exact: true });
  await a.getByLabel("Título da atividade").fill(titulo);
  await a
    .getByLabel("Tipo de atividade")
    .selectOption({ label: `Tipo ${sufixo}` });
  await a
    .getByLabel("Entidade promotora")
    .selectOption({ label: `Promotora ${sufixo}` });
  await a.getByLabel("Data inicial").fill("2024-06-01");
  await a.getByLabel("Data final").fill("2024-06-01");
  await a.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: new RegExp(titulo) }).click();
  await page
    .getByRole("button", { name: "Criar reunião", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: titulo, exact: true }),
  ).toBeVisible();
  await page.getByText("Cadastrar visitante", { exact: true }).click();
  const v = page.getByRole("form", { name: "Novo visitante" });
  await v.getByLabel("Nome do visitante").fill(visitante);
  await v.getByRole("button", { name: "Salvar" }).click();
  const grupo = page.getByRole("group", { name: `Frequência de ${visitante}` });
  await grupo
    .getByRole("button", { name: "Presença com Atraso", exact: true })
    .click();
  await expect(
    grupo.getByRole("button", { name: "Presença com Atraso", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: new RegExp(titulo) }).click();
  await page
    .getByText("Alterar ou cancelar esta ocorrência", { exact: true })
    .click();
  const e = page.getByRole("form", { name: "Exceção da ocorrência" });
  await e.getByLabel("Nova situação").selectOption("4");
  await e.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(`${titulo}.*Cancelada`) }),
  ).toBeVisible();
  await page.getByLabel("Visualização").selectOption("ano");
  await expect(
    page.getByRole("heading", { name: "junho", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Visualização").selectOption("mes");
  await expect(page.getByLabel("Calendário", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "../../artifacts/agenda-desktop.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../artifacts/operacao-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Áreas de trabalho" }).click();
  await page
    .getByRole("link", { name: "Pessoas e jornada", exact: true })
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
