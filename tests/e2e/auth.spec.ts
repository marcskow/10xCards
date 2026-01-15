import { test, expect } from "@playwright/test";

/**
 * Example E2E test - login page
 */
test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    // Check if login page loaded
    await expect(page).toHaveTitle(/10xCards/);

    // Check if login form is visible
    // Tests will be expanded with feature implementation
  });
});
