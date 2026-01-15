# Testy - 10xCards

Katalog zawiera testy jednostkowe i E2E dla aplikacji 10xCards.

## Struktura katalogów

```
tests/
├── unit/           # Testy jednostkowe (Vitest)
├── e2e/            # Testy E2E (Playwright)
│   ├── auth.spec.ts              # Authentication tests
│   ├── sets-browsing.spec.ts     # Sets and cards browsing flow
│   ├── card-navigation.spec.ts   # Card navigation and interaction
│   ├── pages/                    # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   └── SetViewPage.ts
│   └── helpers/                  # Helper functions
│       ├── test-helpers.ts
│       └── sets-helpers.ts
├── fixtures/       # Dane testowe i mocki
└── setup/          # Konfiguracja środowiska testowego
```

## Testy jednostkowe (Vitest)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Uruchom testy w trybie watch
npm run test:unit:watch

# Uruchom testy z interfejsem UI
npm run test:unit:ui

# Generuj raport coverage
npm run test:unit:coverage
```

### Pisanie testów

Testy jednostkowe powinny znajdować się w katalogu `tests/unit/` lub obok testowanego kodu z sufixem `.test.ts` lub `.spec.ts`.

Przykład testu:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' };
    
    // Act
    render(<ComponentName {...props} />);
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Testy E2E (Playwright)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy w trybie headed (z widoczną przeglądarką)
npm run test:e2e:headed

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Otwórz raport z ostatnich testów
npm run test:e2e:report

# Użyj narzędzia codegen do generowania testów
npm run test:e2e:codegen
```

### Struktura testów E2E

- **auth.spec.ts** - Testy autentykacji (login, register)
- **sets-browsing.spec.ts** - Pełny flow przeglądania zestawów i fiszek
  - Tworzenie zestawów
  - Dodawanie fiszek
  - Przeglądanie fiszek w zestawie
  - Nawigacja między kartami
- **card-navigation.spec.ts** - Szczegółowe testy nawigacji po fiszkach
  - Nawigacja do przodu i wstecz
  - Przewracanie fiszek
  - Weryfikacja zawartości fiszek

### Page Object Models

- **LoginPage** - Strona logowania
- **HomePage** - Strona główna z listą zestawów
- **SetViewPage** - Widok zestawu z fiszkami

### Pisanie testów

Testy E2E powinny znajdować się w katalogu `tests/e2e/` z sufixem `.spec.ts`.

Przykład testu:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    // Navigate
    await page.goto('/');
    
    // Interact
    await page.click('button[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

## Best Practices

### Testy jednostkowe

- Używaj opisowych nazw testów w stylu "should do X when Y"
- Stosuj wzorzec AAA (Arrange, Act, Assert)
- Mockuj zależności zewnętrzne (API, baza danych)
- Testuj pojedyncze jednostki kodu (funkcje, komponenty)
- Utrzymuj wysoką czytelność testów

### Testy E2E

- Testuj krytyczne ścieżki użytkownika
- Używaj data-testid do identyfikacji elementów
- Implementuj Page Object Model dla złożonych stron
- Unikaj hardcoded timeoutów, używaj auto-waiting Playwright
- Testuj na różnych rozmiarach ekranu jeśli to istotne

## Narzędzia

- **Vitest** - Framework do testów jednostkowych
- **React Testing Library** - Testowanie komponentów React
- **Playwright** - Framework do testów E2E
- **jsdom** - Symulacja środowiska przeglądarki dla testów jednostkowych

## Coverage

Cel pokrycia kodu testami jednostkowymi: **70%**

Sprawdź aktualny coverage:
```bash
npm run test:unit:coverage
```

Raport coverage znajduje się w katalogu `coverage/`.
