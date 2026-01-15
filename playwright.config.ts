import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Uruchom testy w plikach równolegle */
  fullyParallel: true,

  /* Nie rób retry w CI, rób retry lokalnie */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* Równoległe uruchomienie w CI, sekwencyjne lokalnie */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter do użycia */
  reporter: process.env.CI ? 'github' : 'html',

  /* Współdzielone ustawienia dla wszystkich projektów */
  use: {
    /* URL bazowy dla działań nawigacyjnych */
    baseURL: process.env.BASE_URL || 'http://localhost:4321',

    /* Zbieraj trace tylko przy niepowodzeniu testu */
    trace: 'on-first-retry',

    /* Zbieraj screenshot przy niepowodzeniu */
    screenshot: 'only-on-failure',

    /* Nagrywaj video przy niepowodzeniu */
    video: 'retain-on-failure',
  },

  /* Konfiguracja dla różnych przeglądarek - zgodnie z wytycznymi tylko Chromium */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Uruchom dev server przed rozpoczęciem testów */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

