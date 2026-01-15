# Konfiguracja Środowiska Testowego - 10xCards

## Status: ✅ Ukończone

Środowisko testowe zostało pomyślnie skonfigurowane i jest gotowe do użycia.

## Zainstalowane narzędzia

### Vitest (Testy jednostkowe)
- ✅ `vitest` v4.0.17 - Framework do testów jednostkowych
- ✅ `@vitest/ui` v4.0.17 - Interfejs UI do przeglądania testów
- ✅ `@vitest/coverage-v8` v4.0.17 - Provider do coverage
- ✅ `@vitejs/plugin-react` v4.7.0 - Plugin React dla Vite
- ✅ `happy-dom` - Szybka implementacja DOM dla testów
- ✅ `@testing-library/react` v16.3.1 - Testowanie komponentów React
- ✅ `@testing-library/jest-dom` v6.9.1 - Custom matchers dla DOM
- ✅ `@testing-library/user-event` v14.6.1 - Symulacja interakcji użytkownika

### Playwright (Testy E2E)
- ✅ `@playwright/test` v1.57.0 - Framework do testów E2E
- ✅ Chromium v143.0.7499.4 - Przeglądarka do testów

## Struktura katalogów

```
tests/
├── unit/                    # Testy jednostkowe
│   └── example.test.ts      # Przykładowy test
├── e2e/                     # Testy E2E
│   ├── auth.spec.ts         # Przykładowy test E2E
│   ├── pages/               # Page Object Models
│   │   ├── LoginPage.ts
│   │   └── HomePage.ts
│   └── helpers/             # Helper functions
│       └── test-helpers.ts
├── fixtures/                # Dane testowe i mocki
│   └── supabase.mock.ts
├── setup/                   # Konfiguracja środowiska
│   ├── vitest.setup.ts      # Setup dla Vitest
│   └── test-utils.tsx       # Utilities do testowania
└── README.md                # Dokumentacja testów
```

## Pliki konfiguracyjne

### vitest.config.ts
- Environment: `happy-dom`
- Setup file: `./tests/setup/vitest.setup.ts`
- Coverage threshold: 70%
- Aliasy: `@`, `@components`, `@lib`, `@db`

### playwright.config.ts
- Base URL: `http://localhost:4321`
- Browser: Chromium (Desktop Chrome)
- Parallel execution w CI
- Auto-start dev server
- Trace on first retry
- Screenshot on failure

### package.json scripts
```json
{
  "test": "npm run test:unit && npm run test:e2e",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:unit:ui": "vitest --ui",
  "test:unit:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report",
  "test:e2e:codegen": "playwright codegen http://localhost:4321"
}
```

## Weryfikacja

### Test jednostkowy ✅
```bash
npm run test:unit
# Wynik: 1 test passed
```

### Test E2E (wymaga uruchomionej aplikacji)
```bash
npm run test:e2e
```

## Przykłady użycia

### Test jednostkowy komponentu React

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/setup/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Test E2E z Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { generateTestEmail } from './helpers/test-helpers';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  
  await expect(page).toHaveURL('/');
});
```

## Następne kroki

1. Implementuj testy jednostkowe dla istniejących komponentów
2. Dodaj testy E2E dla krytycznych przepływów użytkownika
3. Skonfiguruj CI/CD do automatycznego uruchamiania testów
4. Monitoruj pokrycie kodu testami (target: 70%)

## Troubleshooting

### Problem z importami w testach
- Sprawdź aliasy w `vitest.config.ts`
- Upewnij się, że ścieżki są zgodne z `tsconfig.json`

### Testy E2E timeout
- Zwiększ timeout w `playwright.config.ts`
- Sprawdź czy dev server się uruchomił

### Coverage nie działa
- Upewnij się, że `@vitest/coverage-v8` jest zainstalowane
- Uruchom: `npm run test:unit:coverage`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Test Plan](./docs/test-plan.md)
- [Tests README](./tests/README.md)

