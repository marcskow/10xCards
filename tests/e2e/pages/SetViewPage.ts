import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for set view page (card browser)
 */
export class SetViewPage {
  readonly page: Page;
  readonly setTitle: Locator;
  readonly addCardButton: Locator;
  readonly generateCardsButton: Locator;
  readonly cardView: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly cardCounter: Locator;
  readonly emptyStateMessage: Locator;
  readonly addFirstCardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.setTitle = page.locator("h1.text-2xl");
    this.addCardButton = page.locator('button[aria-label="Add new card"], button:has(svg) >> nth=1');
    this.generateCardsButton = page.locator('button:has-text("Generate"), button:has(svg) >> nth=0');
    this.cardView = page.locator(".perspective-1000, [class*='card']").first();
    this.previousButton = page.locator('button:has-text("Previous")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.cardCounter = page.locator('p:has-text("Card")');
    this.emptyStateMessage = page.locator('h2:has-text("This set is empty")');
    this.addFirstCardButton = page.locator('button:has-text("Add First Card")');
  }

  async goto(setId: string) {
    await this.page.goto(`/sets/${setId}`);
    await this.setTitle.waitFor();
  }

  async getSetTitle() {
    return await this.setTitle.textContent();
  }

  async isCardVisible() {
    return await this.cardView.isVisible();
  }

  async hasEmptyState() {
    return await this.emptyStateMessage.isVisible();
  }

  async getCardText(side: "front" | "back" = "front") {
    if (side === "front") {
      return await this.cardView.locator("p.text-xl").first().textContent();
    } else {
      // Click to flip if we need back
      await this.cardView.click();
      await this.page.waitForTimeout(800); // Wait for flip animation
      return await this.cardView.locator("p.text-xl").last().textContent();
    }
  }

  async flipCard() {
    await this.cardView.click();
    await this.page.waitForTimeout(800); // Wait for flip animation
  }

  async goToNextCard() {
    await this.nextButton.click();
    await this.page.waitForTimeout(300);
  }

  async goToPreviousCard() {
    await this.previousButton.click();
    await this.page.waitForTimeout(300);
  }

  async getCurrentCardIndex() {
    const counterText = await this.cardCounter.textContent();
    const match = counterText?.match(/Card (\d+) of (\d+)/);
    if (match) {
      return {
        current: parseInt(match[1]),
        total: parseInt(match[2]),
      };
    }
    return { current: 0, total: 0 };
  }

  async addCard(front: string, back: string) {
    await this.addCardButton.click();

    // Fill in the dialog
    await this.page.locator('textarea[name="front"], input[name="front"]').fill(front);
    await this.page.locator('textarea[name="back"], input[name="back"]').fill(back);

    // Submit the form
    await this.page.locator('button[type="submit"]').click();

    // Wait for dialog to close and card to appear
    await this.page.waitForTimeout(500);
  }

  async isNavigationEnabled() {
    const prevDisabled = await this.previousButton.isDisabled();
    const nextDisabled = await this.nextButton.isDisabled();
    return {
      previous: !prevDisabled,
      next: !nextDisabled,
    };
  }
}
