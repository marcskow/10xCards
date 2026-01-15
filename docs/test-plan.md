# Plan Testów dla Aplikacji 10xCards

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji 10xCards, platformy do tworzenia i udostępniania cyfrowych fiszek. Plan ten obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie wysokiej jakości, niezawodności i bezpieczeństwa aplikacji.

### 1.2. Cele testowania

Główne cele procesu testowania to:
- Weryfikacja, czy wszystkie funkcjonalności aplikacji działają zgodnie z wymaganiami.
- Zapewnienie spójności i poprawności działania interfejsu użytkownika na różnych urządzeniach i przeglądarkach.
- Identyfikacja i eliminacja błędów oraz potencjalnych problemów z wydajnością i bezpieczeństwem.
- Zapewnienie, że aplikacja jest intuicyjna i łatwa w obsłudze dla użytkownika końcowego.
- Walidacja poprawności integracji z usługami zewnętrznymi, takimi jak Supabase i OpenRouter.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- **Zarządzanie kontem użytkownika:** Rejestracja, logowanie, wylogowywanie.
- **Zarządzanie zestawami fiszek (Sets):** Tworzenie, przeglądanie, edycja, usuwanie zestawów.
- **Zarządzanie fiszkami (Cards):** Tworzenie, przeglądanie, edycja, usuwanie fiszek w ramach zestawu.
- **Generowanie fiszek AI:** Funkcjonalność generowania fiszek na podstawie podanego tematu przy użyciu AI.
- **Nawigacja i interfejs użytkownika:** Ogólna nawigacja po aplikacji, responsywność interfejsu, przełączanie motywu (ciemny/jasny).

### 2.2. Funkcjonalności wyłączone z testów

- Testy obciążeniowe i wydajnościowe na dużą skalę (poza podstawową weryfikacją).
- Testy penetracyjne (wymagające specjalistycznych narzędzi i wiedzy).

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):** Weryfikacja pojedynczych komponentów React, funkcji pomocniczych i logiki biznesowej w serwisach.
- **Testy integracyjne (Integration Tests):** Sprawdzenie współpracy pomiędzy komponentami front-endowymi a endpointami API oraz integracji z bazą danych Supabase.
- **Testy End-to-End (E2E):** Symulacja pełnych scenariuszy użytkownika, od logowania po zarządzanie fiszkami, w celu weryfikacji przepływu danych i interakcji w całej aplikacji.
- **Testy manualne (Manual Testing):** Ręczne testowanie interfejsu użytkownika w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych, oraz oceny ogólnego doświadczenia użytkownika (UX).
- **Testy kompatybilności (Compatibility Testing):** Sprawdzenie, czy aplikacja działa poprawnie na najpopularniejszych przeglądarkach internetowych (Chrome, Firefox, Safari, Edge) i różnych rozmiarach ekranu (desktop, tablet, mobile).

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autentykacja użytkownika

- **Rejestracja:**
    - Pomyślna rejestracja z poprawnymi danymi.
    - Próba rejestracji z już istniejącym adresem e-mail.
    - Próba rejestracji z niepoprawnym formatem e-maila lub zbyt krótkim hasłem.
- **Logowanie:**
    - Pomyślne logowanie z poprawnymi danymi.
    - Próba logowania z błędnym hasłem lub nieistniejącym użytkownikiem.
- **Wylogowywanie:**
    - Pomyślne wylogowanie i przekierowanie na stronę logowania.
- **Ochrona tras:**
    - Próba dostępu do stron chronionych bez zalogowania (np. `/`) powinna przekierować na stronę logowania.

### 4.2. Zarządzanie zestawami fiszek

- Pomyślne utworzenie nowego zestawu.
- Wyświetlanie listy zestawów należących do zalogowanego użytkownika.
- Poprawne usuwanie zestawu i wszystkich powiązanych z nim fiszek.
- Walidacja formularza tworzenia zestawu (np. pusta nazwa).

### 4.3. Zarządzanie fiszkami

- Pomyślne dodanie nowej fiszki do zestawu.
- Wyświetlanie fiszek w ramach wybranego zestawu.
- Poprawne usuwanie fiszki.
- Walidacja formularza tworzenia fiszki.

### 4.4. Generowanie fiszek przez AI

- Pomyślne wygenerowanie fiszek na podstawie podanego tematu.
- Obsługa błędów w przypadku problemów z komunikacją z API (np. OpenRouter).
- Sprawdzenie, czy wygenerowane fiszki są poprawnie dodawane do zestawu.

## 5. Środowisko testowe

- **Środowisko lokalne:** Programistyczne środowisko deweloperskie z wykorzystaniem lokalnej instancji lub dedykowanej instancji deweloperskiej Supabase.
- **Środowisko stagingowe (zalecane):** Oddzielne środowisko zbliżone do produkcyjnego, na którym będą przeprowadzane testy E2E i akceptacyjne przed wdrożeniem na produkcję.
- **Przeglądarki:** Najnowsze wersje Google Chrome, Mozilla Firefox, Safari, Microsoft Edge.

## 6. Narzędzia do testowania

- **Testy jednostkowe i integracyjne:** Vitest, React Testing Library.
- **Testy E2E:** Playwright.
- **Linting:** ESLint.
- **Zarządzanie zadaniami i błędami:** GitHub Issues.

## 7. Harmonogram testów

- **Testy jednostkowe i integracyjne:** Powinny być pisane na bieżąco wraz z rozwojem nowych funkcjonalności.
- **Testy E2E:** Rozwijane równolegle z kluczowymi funkcjonalnościami i uruchamiane przed każdym wdrożeniem.
- **Testy manualne i regresji:** Przeprowadzane przed każdym wydaniem nowej wersji aplikacji.

## 8. Kryteria akceptacji testów

- **Kryterium wejścia:** Nowa funkcjonalność jest zaimplementowana i dostępna w środowisku testowym.
- **Kryterium wyjścia:**
    - Wszystkie zaplanowane testy jednostkowe, integracyjne i E2E kończą się sukcesem.
    - Nie występują żadne krytyczne ani poważne błędy.
    - Pokrycie kodu testami jednostkowymi utrzymuje się na zdefiniowanym poziomie (np. 70%).
    - Wszystkie zgłoszone błędy o wysokim priorytecie zostały naprawione i zweryfikowane.

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy:** Odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla tworzonego przez siebie kodu oraz za naprawę zgłoszonych błędów.
- **Inżynier QA (jeśli dotyczy):** Odpowiedzialny za tworzenie i utrzymanie scenariuszy testowych E2E, przeprowadzanie testów manualnych, raportowanie błędów i weryfikację poprawek. W przypadku braku dedykowanej roli, odpowiedzialność ta może być rozdzielona w zespole.

## 10. Procedury raportowania błędów

- Wszystkie znalezione błędy powinny być raportowane w systemie śledzenia błędów (GitHub Issues).
- Każdy raport o błędzie powinien zawierać:
    - Tytuł jasno opisujący problem.
    - Szczegółowy opis kroków do reprodukcji błędu.
    - Oczekiwany i rzeczywisty rezultat.
    - Informacje o środowisku (przeglądarka, system operacyjny).
    - Zrzuty ekranu lub nagrania wideo (jeśli to możliwe).
    - Priorytet błędu (np. Krytyczny, Wysoki, Średni, Niski).

