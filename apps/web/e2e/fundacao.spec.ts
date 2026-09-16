import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("acesso web, contexto, logout e acessibilidade", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Entrar na minha conta/ }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: /Entrar na minha conta/ }).click();
  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Embaixada de demonstração" }),
  ).toBeVisible();
  const primeiraAba = page.getByRole("tab", { name: "Pessoas e jornada" });
  await expect(
    page.getByRole("tablist", { name: "Gestão da Embaixada" }),
  ).toBeVisible();
  await primeiraAba.focus();
  await primeiraAba.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Igreja e Embaixada" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Igreja e Embaixada" }).press("Home");
  await expect(primeiraAba).toHaveAttribute("aria-selected", "true");
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
    path: "../../artifacts/web-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "../../artifacts/web-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Entrar na minha conta/ }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
