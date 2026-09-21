import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("login acessível por teclado, erro neutro e encerramento da sessão", async ({
  page,
}) => {
  await page.goto("/conta/entrar");
  await expect(
    page.getByRole("heading", { name: "Entre na sua conta", level: 2 }),
  ).toBeVisible();

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.setViewportSize({ width: 1440, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../artifacts/login-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../artifacts/login-mobile.png",
    fullPage: true,
  });

  await page.keyboard.press("Tab");
  const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(pular).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("E-mail")).toBeFocused();
  await page.keyboard.type("desconhecido@example.test");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Senha-Incorreta-123!");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível entrar. Confira os dados ou tente novamente mais tarde.",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.getByLabel("E-mail").fill("adulto@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.BOOTSTRAP_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Pessoas e jornada", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Entrar na minha conta/ }),
  ).toBeVisible();
});
