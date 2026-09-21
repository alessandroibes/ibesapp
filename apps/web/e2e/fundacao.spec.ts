import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("acesso web, contexto, logout e acessibilidade", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Entrar na minha conta/ }),
  ).toBeVisible({ timeout: 15_000 });
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
    page.getByRole("heading", { name: "Meninos e jornada", level: 1 }),
  ).toBeVisible();
  const primeiraAba = page.getByRole("link", { name: "Meninos e jornada" });
  await expect(
    page.getByRole("navigation", { name: "Gestão da Embaixada" }),
  ).toBeVisible();
  await expect(primeiraAba).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Igreja e Embaixada" }).click();
  await expect(
    page.getByRole("link", { name: "Igreja e Embaixada" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page).toHaveURL(/\/instituicao$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Igreja e Embaixada", level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Agenda e reuniões" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/instituicao$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/agenda$/);
  await page.goBack();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  const botaoMenu = page.getByRole("button", { name: "Áreas de trabalho" });
  await botaoMenu.click();
  await expect(
    page.getByRole("dialog", { name: "Áreas de trabalho" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(botaoMenu).toBeFocused();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
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
