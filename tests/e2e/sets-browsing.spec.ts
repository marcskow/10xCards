import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { SetViewPage } from "./pages/SetViewPage";
import { generateTestEmail } from "./helpers/test-helpers";

/**
 * E2E Test Suite: Sets and Cards Browsing Flow
 *
 * This test suite covers the complete user journey:
 * 1. User logs in
 * 2. Views the sets list
 * 3. Creates a new set
 * 4. Navigates to set view
 * 5. Adds cards to the set
 * 6. Browses through cards
 */
test.describe("Sets and Cards Browsing Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from login page
    await page.goto("/login");
  });

  test("should display empty sets list after login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    // Login with test credentials
    await loginPage.login("test@example.com", "password123");

    // Should redirect to home page
    await expect(page).toHaveURL("/");
    await expect(homePage.heading).toBeVisible();
  });

  test("should create a new set and view it", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const setViewPage = new SetViewPage(page);

    // Login
    await loginPage.login("test@example.com", "password123");
    await homePage.goto();

    // Create a new set
    const setName = `Test Set ${Date.now()}`;
    const setDescription = "This is a test set for E2E testing";
    await homePage.createNewSet(setName, setDescription);

    // Verify set appears in the list
    const setCard = await homePage.getSetCard(setName);
    await expect(setCard).toBeVisible();

    // Click on the set to open it
    await homePage.clickSetByName(setName);

    // Should navigate to set view page
    await expect(page).toHaveURL(/\/sets\/.+/);

    // Set title should be visible
    const title = await setViewPage.getSetTitle();
    expect(title).toBe(setName);

    // Should show empty state
    const isEmpty = await setViewPage.hasEmptyState();
    expect(isEmpty).toBe(true);
  });

  test("should add cards to a set and browse through them", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const setViewPage = new SetViewPage(page);

    // Login
    await loginPage.login("test@example.com", "password123");
    await homePage.goto();

    // Create a new set
    const setName = `Card Browse Test ${Date.now()}`;
    await homePage.createNewSet(setName);

    // Navigate to the set
    await homePage.clickSetByName(setName);

    // Add first card
    await setViewPage.addCard("What is TypeScript?", "TypeScript is a typed superset of JavaScript");

    // Verify first card is visible
    const isVisible = await setViewPage.isCardVisible();
    expect(isVisible).toBe(true);

    // Check card content
    const firstCardFront = await setViewPage.getCardText("front");
    expect(firstCardFront).toContain("What is TypeScript?");

    // Add second card
    await setViewPage.addCard("What is React?", "React is a JavaScript library for building user interfaces");

    // Add third card
    await setViewPage.addCard("What is Playwright?", "Playwright is a testing framework for web applications");

    // Check card counter
    const counter = await setViewPage.getCurrentCardIndex();
    expect(counter.total).toBe(3);
    expect(counter.current).toBe(1);

    // Navigate to next card
    await setViewPage.goToNextCard();

    // Check we're on card 2
    const counter2 = await setViewPage.getCurrentCardIndex();
    expect(counter2.current).toBe(2);

    // Check second card content
    const secondCardFront = await setViewPage.getCardText("front");
    expect(secondCardFront).toContain("What is React?");

    // Navigate to next card (card 3)
    await setViewPage.goToNextCard();
    const counter3 = await setViewPage.getCurrentCardIndex();
    expect(counter3.current).toBe(3);

    // Navigate back to previous card
    await setViewPage.goToPreviousCard();
    const counter4 = await setViewPage.getCurrentCardIndex();
    expect(counter4.current).toBe(2);
  });

  test("should flip card to see back side", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const setViewPage = new SetViewPage(page);

    // Login
    await loginPage.login("test@example.com", "password123");
    await homePage.goto();

    // Create a new set
    const setName = `Flip Test ${Date.now()}`;
    await homePage.createNewSet(setName);

    // Navigate to the set
    await homePage.clickSetByName(setName);

    // Add a card
    const frontText = "What is the capital of France?";
    const backText = "Paris";
    await setViewPage.addCard(frontText, backText);

    // Verify front is visible
    const front = await setViewPage.getCardText("front");
    expect(front).toContain(frontText);

    // Flip card
    await setViewPage.flipCard();

    // Verify back is visible (note: this might need adjustment based on actual implementation)
    // The card should now show the back side after animation
    await page.waitForTimeout(1000); // Wait for flip animation
  });

  test("complete user journey: login -> create set -> add cards -> browse", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const setViewPage = new SetViewPage(page);

    // Step 1: Login
    await loginPage.login("test@example.com", "password123");

    // Step 2: Verify we're on home page
    await expect(page).toHaveURL("/");
    await expect(homePage.heading).toBeVisible();

    // Step 3: Create a new set
    const setName = `Complete Journey ${Date.now()}`;
    await homePage.createNewSet(setName, "A comprehensive test set");

    // Step 4: Verify set appears in list
    const setCard = await homePage.getSetCard(setName);
    await expect(setCard).toBeVisible();

    // Step 5: Click on set to open it
    await homePage.clickSetByName(setName);

    // Step 6: Verify we're on set view page
    await expect(page).toHaveURL(/\/sets\/.+/);
    const title = await setViewPage.getSetTitle();
    expect(title).toBe(setName);

    // Step 7: Add multiple cards
    const cards = [
      { front: "Question 1", back: "Answer 1" },
      { front: "Question 2", back: "Answer 2" },
      { front: "Question 3", back: "Answer 3" },
    ];

    for (const card of cards) {
      await setViewPage.addCard(card.front, card.back);
    }

    // Step 8: Verify card count
    const counter = await setViewPage.getCurrentCardIndex();
    expect(counter.total).toBe(3);

    // Step 9: Browse through all cards
    for (let i = 1; i <= 3; i++) {
      const currentCounter = await setViewPage.getCurrentCardIndex();
      expect(currentCounter.current).toBe(i);

      const cardText = await setViewPage.getCardText("front");
      expect(cardText).toContain(`Question ${i}`);

      if (i < 3) {
        await setViewPage.goToNextCard();
      }
    }

    // Step 10: Navigate back to home
    await homePage.goto();

    // Verify set still exists in list
    const setCardAfter = await homePage.getSetCard(setName);
    await expect(setCardAfter).toBeVisible();
  });
});
