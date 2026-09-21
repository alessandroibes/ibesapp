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

test("separa Conselheiro, Visitante e Inativo e mantém responsável livre", async ({
  page,
}) => {
  await entrar(page);
  const sufixo = Date.now();
  const nomeAdulto = `Conselheiro fictício ${sufixo}`;
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  let formulario = page.getByRole("form", { name: "Nova pessoa" });
  await formulario.getByLabel("Nome completo").fill(nomeAdulto);
  await formulario.getByLabel("Data de nascimento").fill("1980-01-01");
  await formulario.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("link", { name: "Conselheiros", exact: true }).click();
  await page.getByRole("button", { name: "Cadastrar Conselheiro" }).click();
  await page.getByLabel("Buscar pessoa").fill(nomeAdulto);
  await page.getByLabel("Pessoa *").selectOption({ label: nomeAdulto });
  await page
    .getByRole("dialog", { name: "Cadastrar Conselheiro" })
    .getByRole("button", { name: "Salvar" })
    .click();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: nomeAdulto }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cadastrar Conselheiro" }),
  ).toBeFocused();
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
  await page.setViewportSize({ width: 1280, height: 900 });

  await page
    .getByRole("link", { name: "Meninos e jornada", exact: true })
    .click();
  const nomeMenino = `Visitante fictício ${sufixo}`;
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  formulario = page.getByRole("form", { name: "Nova pessoa" });
  await formulario.getByLabel("Nome completo").fill(nomeMenino);
  await formulario.getByLabel("Data de nascimento").fill("2012-01-01");
  await formulario.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("tab", { name: "Jornada" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Vínculos" }).click();
  await page.getByText("Adicionar responsável").click();
  const responsavel = page.getByRole("form", { name: "Novo responsável" });
  await responsavel.getByLabel("Relação *").fill("Mãe");
  await responsavel.getByLabel("Nome *").fill("Responsável fictícia");
  await responsavel.getByLabel("Telefone/WhatsApp").fill("11999999999");
  await responsavel.getByLabel("Mora com o Embaixador?").selectOption("true");
  await responsavel.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Mãe: Responsável fictícia")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Inativar" }).click();
  await page.getByLabel("Motivo *").fill("Cadastro de validação");
  await page.getByRole("button", { name: "Confirmar inativação" }).click();
  await page
    .getByRole("link", { name: "Meninos e jornada", exact: true })
    .click();
  await page.getByRole("button", { name: "Inativos" }).click();
  await expect(page.getByText(nomeMenino)).toBeVisible();
  await expect(page.getByText(nomeAdulto)).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
