import { test, expect } from "@playwright/test";

/**
 * Public marketing landing (`/`) — the most-visited, always-public page and the
 * first thing any visitor sees. It's a Server Component (calls auth() to vary
 * the header) with a history of render issues, yet had zero E2E coverage. These
 * guard that it renders publicly, the primary Sign-in CTA works, and any
 * deployment-specific forbidden public text stays off the public face.
 */

test("/ renders publicly without an auth bounce", async ({ page }) => {
  const resp = await page.goto("/");
  expect(resp?.status() ?? 0, "must not 5xx").toBeLessThan(500);
  await expect(page).not.toHaveURL(/\/login/);
  // Hero is present (split across spans, so match a robust fragment).
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/hire/i);
});

test("the primary Sign-in CTA links to /login and works", async ({ page }) => {
  await page.goto("/");
  // At least one visible "Sign in" control pointing at /login.
  const signIn = page.getByRole("link", { name: /sign in/i }).first();
  await expect(signIn).toBeVisible();
  await expect(signIn).toHaveAttribute("href", /\/login/);

  await signIn.click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("landing carries no configured forbidden public text", async ({ page }) => {
  const forbidden = process.env.E2E_FORBIDDEN_PUBLIC_TEXT;
  if (!forbidden) {
    test.skip(true, "Set E2E_FORBIDDEN_PUBLIC_TEXT to enforce a deployment-specific scrub.");
    return;
  }
  await page.goto("/");
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body, "forbidden public text should not appear on the landing page").not.toContain(
    forbidden.toLowerCase(),
  );
});
