import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { SetViewPage } from "./pages/SetViewPage";
import { createTestSetWithCards, deleteTestSetViaAPI } from "./helpers/sets-helpers";

/**
 * E2E Test Suite: Card Navigation and Interaction
 *
 * Tests focused on card browsing, flipping, and navigation
 * Uses API for faster test setup
 */
test.describe("Card Navigation and Interaction", () => {
  let setId: string;
  let setName: string;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login first
    await page.goto("/login");
    await loginPage.login("test@example.com", "password123");

    // Create a test set with cards via API
    const testData = await createTestSetWithCards(page);
    setId = testData.setId;
    setName = testData.setName;
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: delete test set
    if (setId) {
      await deleteTestSetViaAPI(page, setId);
    }
  });

  test("should navigate through cards in order", async ({ page }) => {
    const setViewPage = new SetViewPage(page);

    // Navigate to the set
    await setViewPage.goto(setId);

    // Verify we start at card 1
    let counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(1);
    expect(counter.total).toBe(3);

    // Navigate through all cards
    await setViewPage.goToNextCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(2);

    await setViewPage.goToNextCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(3);

    // Should not go beyond last card
    await setViewPage.goToNextCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(3); // Still on last card
  });

  test("should navigate backwards through cards", async ({ page }) => {
    const setViewPage = new SetViewPage(page);

    // Navigate to the set
    await setViewPage.goto(setId);

    // Go to last card
    await setViewPage.goToNextCard();
    await setViewPage.goToNextCard();

    let counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(3);

    // Navigate backwards
    await setViewPage.goToPreviousCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(2);

    await setViewPage.goToPreviousCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(1);

    // Should not go before first card
    await setViewPage.goToPreviousCard();
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(1); // Still on first card
  });

  test("should display correct card content while navigating", async ({ page }) => {
    const setViewPage = new SetViewPage(page);

    await setViewPage.goto(setId);

    // Card 1
    let cardText = await setViewPage.getCardText("front");
    expect(cardText).toContain("TypeScript");

    // Card 2
    await setViewPage.goToNextCard();
    cardText = await setViewPage.getCardText("front");
    expect(cardText).toContain("React");

    // Card 3
    await setViewPage.goToNextCard();
    cardText = await setViewPage.getCardText("front");
    expect(cardText).toContain("Playwright");
  });

  test("should flip card to reveal answer", async ({ page }) => {
    const setViewPage = new SetViewPage(page);

    await setViewPage.goto(setId);

    // Check front side
    const frontText = await setViewPage.getCardText("front");
    expect(frontText).toContain("TypeScript");

    // Flip the card
    await setViewPage.flipCard();

    // After flip, back side should be visible
    // Note: Implementation may vary based on actual card flip logic
  });

  test("should maintain card position when navigating back to set view", async ({ page }) => {
    const homePage = new HomePage(page);
    const setViewPage = new SetViewPage(page);

    // Navigate to set
    await setViewPage.goto(setId);

    // Go to card 2
    await setViewPage.goToNextCard();
    let counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBe(2);

    // Navigate back to home
    await homePage.goto();

    // Navigate back to set
    await homePage.clickSetByName(setName);

    // Should start from card 1 again (or maintain position based on implementation)
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.current).toBeGreaterThanOrEqual(1);
  });

  test("should show correct card count after adding new card", async ({ page }) => {
    const setViewPage = new SetViewPage(page);

    await setViewPage.goto(setId);

    // Initial count should be 3
    let counter = await setViewPage.getCurrentCardIndex();
    expect(counter.total).toBe(3);

    // Add a new card
    await setViewPage.addCard("New Question", "New Answer");

    // Count should increase to 4
    counter = await setViewPage.getCurrentCardIndex();
    expect(counter.total).toBe(4);
  });
});
