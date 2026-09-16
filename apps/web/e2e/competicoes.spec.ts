import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("aptidão, elegibilidade e finalização da escalação", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  const sufixo = Date.now();
  const nome = `Competidor E2E ${sufixo}`;
  await page.getByRole("link", { name: "Adicionar pessoa" }).click();
  const pessoa = page.getByRole("form", { name: "Nova pessoa" });
  await pessoa.getByLabel("Nome completo").fill(nome);
  await pessoa.getByLabel("Data de nascimento").fill("2010-01-01");
  await pessoa.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "Iniciar trajetória" }).click();

  await page.getByRole("link", { name: "Competições", exact: true }).click();
  const modalidadeNome = `Natação E2E ${sufixo}`;
  const provaNome = `Revezamento E2E ${sufixo}`;
  const modalidade = page.getByRole("form", { name: "Nova modalidade" });
  await modalidade.getByLabel("Nome da modalidade").fill(modalidadeNome);
  await modalidade.getByRole("button", { name: "Salvar" }).click();
  const prova = page.getByRole("form", { name: "Nova prova" });
  await prova.getByLabel("Modalidade").selectOption({ label: modalidadeNome });
  await prova.getByLabel("Nome da prova").fill(provaNome);
  await prova.getByLabel("Natureza").selectOption({ label: "Coletiva" });
  await prova
    .getByLabel("Referência variável")
    .selectOption({ label: "Nenhuma" });
  await prova.getByRole("button", { name: "Salvar" }).click();

  const aptidao = page.getByRole("form", { name: "Registrar aptidão" });
  await aptidao
    .getByLabel("Prova")
    .selectOption({ label: `${modalidadeNome} · ${provaNome}` });
  await aptidao.getByLabel("Buscar candidato ou embaixador").fill(nome);
  await aptidao
    .getByRole("combobox", { name: /^Candidato ou Embaixador/ })
    .selectOption({ label: nome });
  await aptidao.getByRole("button", { name: "Salvar" }).click();

  const competicaoNome = `Jogos E2E ${sufixo}`;
  const competicao = page.getByRole("form", { name: "Nova competição" });
  await competicao.getByLabel("Nome da competição").fill(competicaoNome);
  await competicao.getByLabel("Data inicial").fill("2026-10-01");
  await competicao.getByLabel("Data final").fill("2026-10-01");
  await competicao.getByLabel("Data-base das categorias").fill("2026-01-01");
  await competicao.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: new RegExp(competicaoNome) }).click();

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

  await page.getByLabel(`Função de ${nome}`).selectOption({ label: "Titular" });
  await page.getByRole("button", { name: "Salvar escalação" }).click();
  await expect(page.getByText(`${nome} · Titular`)).toBeVisible();
  await page.getByRole("button", { name: "Finalizar escalação" }).click();
  await expect(page.getByText("Escalação Finalizada")).toBeVisible();
  await expect(
    page.getByRole("form", { name: "Reabrir escalação" }),
  ).toBeVisible();

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
});
