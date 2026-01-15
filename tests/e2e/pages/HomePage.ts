import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for home page with sets list
 */
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createSetButton: Locator;
  readonly setsList: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1", { hasText: "My Sets" });
    this.createSetButton = page.locator('button:has-text("New Set")');
    this.setsList = page.locator(".grid");
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
    this.emptyStateMessage = page.locator('h2:has-text("No sets found")');
  }

  async goto() {
    await this.page.goto("/");
    await this.heading.waitFor();
  }

  async createNewSet(name: string, description?: string) {
    await this.createSetButton.click();

    // Fill in the dialog
    await this.page.locator('input[name="name"]').fill(name);
    if (description) {
      await this.page.locator('textarea[name="description"]').fill(description);
    }

    // Submit the form
    await this.page.locator('button[type="submit"]').click();

    // Wait for dialog to close
    await this.page.waitForTimeout(500);
  }

  async clickSetByName(setName: string) {
    const setCard = this.page.locator("a", { hasText: setName });
    await setCard.click();
  }

  async getSetCard(setName: string) {
    return this.page.locator("a", { hasText: setName });
  }

  async getSetsCount() {
    const cards = await this.setsList.locator(".card, [class*='card']").count();
    return cards;
  }

  async hasEmptyState() {
    return await this.emptyStateMessage.isVisible();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }
}
