import type { Page } from "@playwright/test";

/**
 * Helper functions for E2E tests
 */

/**
 * Logs in user via API (faster alternative to UI login)
 */
export async function loginViaAPI(page: Page, email: string, password: string) {
  const response = await page.request.post("/api/auth/login", {
    data: {
      email,
      password,
    },
  });

  return response.ok();
}

/**
 * Creates a test user
 */
export async function createTestUser(page: Page, email: string, password: string) {
  const response = await page.request.post("/api/auth/register", {
    data: {
      email,
      password,
    },
  });

  return response.ok();
}

/**
 * Cleans up test data (called in teardown)
 */
export async function cleanupTestData(_page: Page) {
  // Implementation will depend on API
  // e.g., deleting test users, sets, etc.
}

/**
 * Generates a unique email for tests
 */
export function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Waits for element to disappear (loading spinner, etc.)
 */
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForLoadState("networkidle");
  const loader = page.locator('[data-testid="loading"]');
  if (await loader.isVisible()) {
    await loader.waitFor({ state: "hidden" });
  }
}
