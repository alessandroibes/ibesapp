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
  await page
    .getByRole("link", { name: "Igreja e Embaixada", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Igreja", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Embaixada", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editar dados institucionais" }).click();
  await expect(
    page.getByRole("form", { name: "Dados institucionais" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cancelar" }).click();
  await page.getByRole("link", { name: "Manuais", exact: true }).click();
  await page.getByRole("link", { name: "Cadastrar versão" }).click();
  const edicao = `Edição fictícia E2E ${Date.now()}`;
  await page.getByLabel("Identificação exata da edição").fill(edicao);
  await page
    .getByLabel("Tarefas, uma por linha")
    .fill("Tarefa fictícia primeira\nTarefa fictícia segunda");
  await page
    .getByRole("form", { name: "Nova versão do manual" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page.getByText(edicao)).toBeVisible();
  await page
    .getByRole("link", { name: "Meninos e jornada", exact: true })
    .click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  const nova = page.getByRole("form", { name: "Nova pessoa" });
  const nome = `Pessoa fictícia E2E ${Date.now()}`;
  await nova.getByLabel("Nome completo").fill(nome);
  await nova.getByLabel("Data de nascimento").fill("2010-01-01");
  await nova.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByRole("heading", { name: nome, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editar pessoa" }).click();
  await page.getByLabel("Naturalidade").fill("Cidade fictícia");
  await page
    .getByRole("form", { name: "Dados da pessoa" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await expect(page.getByText("Dados da pessoa atualizados.")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar trajetória" }).click();
  await page.getByRole("tab", { name: "Jornada" }).click();
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
  await expect(
    page.getByText("Tarefa 2: Tarefa fictícia segunda", { exact: true }),
  ).toBeVisible();
  const correcao = page.getByRole("form", {
    name: "Corrigir data da Tarefa 2: Tarefa fictícia segunda",
    exact: true,
    includeHidden: true,
  });
  await correcao.locator("..").locator("summary").click();
  await correcao.getByLabel("Data da conclusão").fill("2024-01-04");
  await correcao.getByRole("button", { name: "Salvar data corrigida" }).click();
  await expect(page.getByText("Concluída em 04/01/2024")).toBeVisible();
  await correcao.getByLabel("Data da conclusão").fill("2023-12-31");
  await correcao.getByRole("button", { name: "Salvar data corrigida" }).click();
  await expect(
    page.getByText("A conclusão não pode anteceder o ingresso no posto."),
  ).toBeVisible();
  await expect(page.getByText("Concluída em 04/01/2024")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
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
    .getByRole("link", { name: "Meninos e jornada", exact: true })
    .click();
  await page.getByLabel("Buscar pelo nome").fill(nome);
  await page
    .getByRole("row", { name: new RegExp(nome) })
    .getByRole("link", { name: "Visualizar" })
    .click();
  await page.getByRole("tab", { name: "Jornada" }).click();
  await expect(page.getByText("Concluída em 04/01/2024")).toBeVisible();
});
