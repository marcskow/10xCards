import type { Page } from "@playwright/test";

/**
 * Helper functions for sets and cards E2E tests
 */

/**
 * Creates a test set via API (faster than UI)
 */
export async function createTestSetViaAPI(page: Page, name: string, description?: string) {
  const response = await page.request.post("/api/sets", {
    data: {
      name,
      description: description || "",
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return data.id;
  }

  return null;
}

/**
 * Creates a test card via API (faster than UI)
 */
export async function createTestCardViaAPI(page: Page, setId: string, front: string, back: string) {
  const response = await page.request.post(`/api/sets/${setId}/cards`, {
    data: {
      front,
      back,
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return data.id;
  }

  return null;
}

/**
 * Deletes a set via API (cleanup)
 */
export async function deleteTestSetViaAPI(page: Page, setId: string) {
  const response = await page.request.delete(`/api/sets/${setId}`);
  return response.ok();
}

/**
 * Creates a set with predefined cards for testing
 */
export async function createTestSetWithCards(page: Page) {
  const setName = `Test Set ${Date.now()}`;
  const setId = await createTestSetViaAPI(page, setName, "Test set for E2E");

  if (!setId) {
    throw new Error("Failed to create test set");
  }

  const cards = [
    { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
    { front: "What is React?", back: "A JavaScript library for building UIs" },
    { front: "What is Playwright?", back: "An E2E testing framework" },
  ];

  for (const card of cards) {
    await createTestCardViaAPI(page, setId, card.front, card.back);
  }

  return { setId, setName, cardsCount: cards.length };
}

/**
 * Waits for card flip animation to complete
 */
export async function waitForCardFlip(page: Page) {
  await page.waitForTimeout(800); // Card flip animation duration
}

/**
 * Waits for card navigation transition
 */
export async function waitForCardNavigation(page: Page) {
  await page.waitForTimeout(300); // Card navigation transition
}

/**
 * Generates sample flashcard data
 */
export function generateSampleCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    front: `Question ${i + 1}`,
    back: `Answer ${i + 1}`,
  }));
}
