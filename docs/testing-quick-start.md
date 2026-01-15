# Quick Start - Testing Guide

## Uruchomienie testów

### Testy jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Uruchom w trybie watch (auto-reload przy zmianach)
npm run test:unit:watch

# Uruchom z UI
npm run test:unit:ui

# Wygeneruj raport coverage
npm run test:unit:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z widoczną przeglądarką
npm run test:e2e:headed

# Uruchom w trybie debug
npm run test:e2e:debug

# Pokaż ostatni raport
npm run test:e2e:report

# Nagraj nowy test (codegen)
npm run test:e2e:codegen
```

### Uruchom wszystkie testy

```bash
npm test
```

## Tworzenie nowych testów

### Test jednostkowy

1. Utwórz plik w `tests/unit/` z nazwą `*.test.ts` lub `*.spec.ts`
2. Użyj szablonu:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/setup/test-utils';

describe('Component/Function Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test E2E

1. Utwórz plik w `tests/e2e/` z nazwą `*.spec.ts`
2. Opcjonalnie stwórz Page Object w `tests/e2e/pages/`
3. Użyj szablonu:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user@test.com', 'password');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Best Practices

### Testy jednostkowe
- ✅ Test izolowanych funkcji i komponentów
- ✅ Mockuj external dependencies (API, database)
- ✅ Używaj opisowych nazw testów
- ✅ Follow AAA pattern (Arrange-Act-Assert)
- ✅ Keep tests simple and focused

### Testy E2E
- ✅ Test critical user flows
- ✅ Używaj Page Object Model dla maintainability
- ✅ Używaj data-testid dla stabilnych selectorów
- ✅ Avoid hardcoded waits, use auto-waiting
- ✅ Test happy path i error scenarios

## Debugging

### Testy jednostkowe nie działają
```bash
# Sprawdź szczegóły błędu
npm run test:unit -- --reporter=verbose

# Uruchom tylko jeden plik
npm run test:unit -- tests/unit/specific.test.ts

# Uruchom tylko jeden test
npm run test:unit -- -t "test name"
```

### Testy E2E nie działają
```bash
# Uruchom w trybie headed (zobacz co się dzieje)
npm run test:e2e:headed

# Uruchom w trybie debug (z breakpoints)
npm run test:e2e:debug

# Zobacz ostatni raport
npm run test:e2e:report
```

## Przydatne komendy

```bash
# Aktualizuj snapshots
npm run test:unit -- -u

# Uruchom tylko zmienione testy
npm run test:unit -- --changed

# Filtruj testy po nazwie
npm run test:unit -- -t "Button"

# Uruchom z coverage
npm run test:unit:coverage
```

## Dokumentacja

- 📖 [Test Plan](./docs/test-plan.md)
- 📖 [Test Setup Summary](./docs/test-setup-summary.md)
- 📖 [Tests README](./tests/README.md)
- 📖 [Vitest Docs](https://vitest.dev/)
- 📖 [Playwright Docs](https://playwright.dev/)

