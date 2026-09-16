import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("cadastro e admissão histórica com manual identificado e tarefa fora de ordem", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("link", { name: "Manuais", exact: true }).click();
  const edicao = `Edição fictícia E2E ${Date.now()}`;
  await page.getByLabel("Identificação exata da edição").fill(edicao);
  await page
    .getByLabel("Tarefas, uma por linha")
    .fill("Tarefa fictícia primeira\nTarefa fictícia segunda");
  await page
    .getByRole("form", { name: "Nova versão do manual" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await expect(
    page.getByText(`Embaixador Escudeiro · ${edicao}`),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Pessoas e jornada", exact: true })
    .click();
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  const nova = page.getByRole("form", { name: "Nova pessoa" });
  const nome = `Pessoa fictícia E2E ${Date.now()}`;
  await nova.getByLabel("Nome completo").fill(nome);
  await nova.getByLabel("Data de nascimento").fill("2010-01-01");
  await nova.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByRole("heading", { name: nome, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Iniciar trajetória" }).click();
  const requisitos = [
    "Significado do nome Embaixador do Rei",
    "Compromisso dos ER",
    "Tema dos ER",
    "Divisa dos ER",
    "Hino Oficial dos ER",
  ];
  for (const requisito of requisitos) {
    const formulario = page.getByRole("form", {
      name: `Concluir ${requisito}`,
      exact: true,
      includeHidden: true,
    });
    await formulario.locator("..").locator("summary").click();
    await formulario.getByLabel("Data da conclusão").fill("2024-01-01");
    await formulario.getByRole("button", { name: "Salvar" }).click();
    await expect(formulario).toHaveCount(0);
  }
  const admissao = page.getByRole("form", {
    name: "Registrar admissão oficial",
  });
  await admissao.getByLabel("Data da admissão").fill("2024-01-01");
  await admissao
    .getByLabel("Versão do manual do Escudeiro")
    .selectOption({ label: edicao });
  await admissao.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByText("6 meses por posto.", { exact: true }),
  ).toBeVisible();
  const tarefa = page.getByRole("form", {
    name: "Concluir Tarefa fictícia segunda",
    exact: true,
    includeHidden: true,
  });
  await tarefa.locator("..").locator("summary").click();
  await tarefa.getByLabel("Data da conclusão").fill("2024-01-03");
  await tarefa.getByRole("button", { name: "Salvar" }).click();
  await expect(tarefa).toHaveCount(0);
  await expect(page.getByText("Concluída em 03/01/2024")).toBeVisible();
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
    path: "../../artifacts/jornada-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "Áreas de trabalho" }).click();
  await page
    .getByRole("link", { name: "Pessoas e jornada", exact: true })
    .click();
  await page.getByLabel("Buscar pelo nome").fill(nome);
  await page
    .getByRole("row", { name: new RegExp(nome) })
    .getByRole("link", { name: "Visualizar" })
    .click();
  await expect(page.getByText("Concluída em 03/01/2024")).toBeVisible();
});
