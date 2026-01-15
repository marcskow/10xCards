# Dokument wymagań produktu (PRD) - Cards AI (MVP)

## 1. Przegląd produktu

Celem Cards AI jest skrócenie czasu tworzenia wysokiej jakości fiszek językowych EN↔PL poprzez półautomatyczne generowanie kart z wklejonego tekstu i prosty, iteracyjny proces akceptacji.
Produkt startuje jako aplikacja webowa, bez aplikacji mobilnych, kierowana do osób uczących się języków (głównie angielski), które chcą uczyć się efektywnie metodą powtórek rozłożonych w czasie (SRS).

Zakres MVP bazuje na trzech kamieniach milowych:

* M1: Core CRUD fiszek (manual), proste konta, przegląd fiszek per zestaw.
* M2: Generowanie fiszek przez AI + triage/akceptacja.
* M3: Prosta nauka znam/nie znam
* M4: Integracja open-source SRS (np. SM-2).

Główne założenia:

* Format fiszek: Q&A (front: słowo/zwrot/zdanie, back: tłumaczenie), jedna poprawna odpowiedź.
* Źródło wejścia do generowania: wklejony tekst o długości od 1000 do 10 000 znaków.
* Zestawy: pojedynczy atrybut 'zestaw' (bez wielotagowości, bez podziału na poziomy trudności).
* Retencja źródła: przechowywane jedynie do czasu confirm w triage, następnie usuwane.

## 2. Problem użytkownika

Ręczne tworzenie fiszek jest pracochłonne i zniechęca do regularnej nauki metodą spaced repetition.
Użytkownicy chcą szybko pozyskać solidne, trafne karty z realnych materiałów (artykuły, transkrypcje), móc je łatwo przejrzeć, skorygować i zacząć naukę — bez żmudnego ręcznego przepisywania i tłumaczenia.

## 3. Wymagania funkcjonalne

3.0. Uwierzytelnienie i autoryzacja (M1)

* **Strona startowa**: Aplikacja wymaga logowania przed dostępem do jakiejkolwiek funkcjonalności. Niezalogowani użytkownicy widzą stronę logowania z możliwością przełączenia na formularz rejestracji.
* **Przekierowania**: Wszystkie chronione trasy (zestawy, fiszki, nauka) automatycznie przekierowują niezalogowanych użytkowników na stronę logowania.
* **Persystencja sesji**: Po zalogowaniu sesja jest utrzymywana między odwiedzinami (z użyciem bezpiecznych cookies).
* **Autoryzacja żądań API**: Wszystkie endpointy API wymagają ważnej sesji/tokenu; żądania bez autentykacji zwracają błąd 401.
* **Izolacja danych użytkowników**: Backend weryfikuje, że każde żądanie dotyczy zasobów należących do zalogowanego użytkownika.

3.1. CRUD fiszek i zestawów (M1)

* Tworzenie fiszek manualnie (front/back) z przypisaniem do zestawu.
* Edycja i usuwanie fiszek.
* Przeglądanie listy fiszek w zestawie.
* Zarządzanie zestawami (utworzenie, zmiana nazwy, usunięcie jeśli puste lub z potwierdzeniem).

3.2. Import i weryfikacja treści

* Pole wklejania tekstu o długości od 1000 do 10 000 znaków, z walidacją długości i komunikatami błędów po przekroczeniu limitu lub niedosiągnięciu minimum (M2).
* Komunikaty o błędach i ostrzeżeniach (np. pusty input, niedozwolone znaki) (M2).

3.3. Generowanie fiszek przez AI (M2)

* Ekstrakcja kandydatów (słówka/zwroty/zdania) z wejściowego tekstu.
* Tłumaczenie EN↔PL (kierunek automatycznie rozpoznany lub ustawiony przez użytkownika).
* Suwak celu liczby fiszek (zakres i domyślna wartość do doprecyzowania) oraz podstawowe filtry (np. długość frazy, wykluczenie nazw własnych).
* Prezentacja propozycji w modalu triage: wszystkie domyślnie zaznaczone; użytkownik może odznaczać (odrzucać) i edytować inline.
* Brak podglądu kontekstu, brak skrótów klawiaturowych i akcji zaznacz/odznacz wszystkie w MVP.
* Po confirm: utworzenie fiszek w wybranym zestawie, zapis metryk sesji; źródło usuwane.

3.4. Nauka i SRS

* M1: Przegląd fiszek (lista w trybie edycji).
* M3: Oznaczanie znam/nie znam i filtr przeglądu (tylko nieznane / wszystkie).
* M4: Integracja algorytmu SRS open-source (np. SM-2); harmonogram powtórek.

3.5. Konta i bezpieczeństwo (M1)

* **Wymagane uwierzytelnienie**: Dostęp do aplikacji wymaga zalogowania. Niezalogowani użytkownicy są automatycznie przekierowywani na stronę logowania/rejestracji.
* Rejestracja i logowanie e-mail + hasło (hash+salt).
* Wylogowanie.
* Sesja użytkownika: Mechanizm sesji (cookies/tokens) z rozsądnym czasem wygaśnięcia; automatyczne przedłużanie przy aktywności.
* Izolacja danych: Każdy użytkownik ma dostęp wyłącznie do swoich zestawów i fiszek. Próba dostępu do cudzych zasobów zwraca błąd 403/404.
* Zmiana hasła i usunięcie konta: jeśli czas pozwoli w M1, w przeciwnym razie M2/M3.
* Brak weryfikacji e-mail w M1.

3.6. Analityka i audyt (M2)

* Log sesji generowania: timestamp, liczba znaków wejścia, liczba propozycji, zaakceptowanych, odrzuconych, edytowanych; status sesji (confirmed/aborted).
* Metryka Accept Rate liczona per sesja: accepted/(accepted+rejected); edycje liczą się jako accepted; zamknięte bez confirm nie wchodzą do statystyki.

3.7. Koszty i niezawodność

* Użycie prostego modelu AI; monitoring kosztów (na sesję, per user) w logach/metrics (M2).
* Obsługa błędów/timeoutów generowania i komunikaty dla użytkownika, z możliwością ponowienia lub anulowania (M2).

## 4. Granice produktu

4.1. Poza zakresem MVP

* Własny, zaawansowany algorytm SRS (używamy open-source).
* Import wielu formatów (PDF, DOCX itd.).
* Współdzielenie zestawów i współpraca użytkowników.
* Integracje z zewnętrznymi platformami edukacyjnymi.
* Aplikacje mobilne (na start tylko web).
* Wieloodpowiedzi/alternatywne poprawne odpowiedzi; poziomy CEFR.
* Podgląd kontekstu źródłowego w triage; skróty klawiaturowe; zaznacz/odznacz wszystkie.

4.2. Ograniczenia i wpływ

* Limit wejścia od 1000 do 10 000 znaków może wymagać heurystyk ekstrakcji, by osiągnąć docelową liczbę kart.
* Minimalna retencja utrudnia debugowanie – rekomendowane krótkotrwałe storage in-memory/logi.
* Brak twardych limitów kosztów w M1 – konieczny monitoring.
* Jednotagowość zestawów w MVP upraszcza model danych kosztem elastyczności.

## 5. Historyjki użytkowników

Uwaga: Każda historyjka zawiera jednoznaczne, testowalne kryteria akceptacji. Milestone przypisany w nawiasie.

US-001 — Rejestracja konta (M1)
Opis: Jako nowy użytkownik chcę utworzyć konto używając e-maila i hasła, aby móc zapisywać moje fiszki.
Kryteria akceptacji:

1. Formularz akceptuje poprawny e-mail i hasło spełniające minimalne zasady złożoności.
2. Niepoprawny e-mail/hasło skutkuje komunikatem błędu bez tworzenia konta.
3. Po sukcesie jestem zalogowany i widzę ekran startowy.
4. Hasło jest przechowywane wyłącznie jako hash+salt.

US-002 — Logowanie (M1)
Opis: Jako użytkownik chcę zalogować się e-mail+hasło, aby uzyskać dostęp do moich danych.
Kryteria akceptacji:

1. Prawidłowe dane logują i przekierowują do panelu.
2. Błędne dane pokazują komunikat bez ujawniania, czy konto istnieje.
3. Po zalogowaniu sesja jest utrzymywana do wylogowania/wygaśnięcia.

US-003 — Wylogowanie (M1)
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję.
Kryteria akceptacji:

1. Kliknięcie Wyloguj unieważnia sesję i przenosi na ekran logowania.
2. Cofnięcie/przeładowanie nie przywraca sesji.

US-004 — Zmiana hasła (M1/M2)
Opis: Jako zalogowany użytkownik chcę zmienić hasło.
Kryteria akceptacji:

1. Wymagane stare hasło i zgodność nowego z zasadami.
2. Po zmianie stare tokeny sesji są unieważnione.
3. Błędne stare hasło zwraca czytelny komunikat.

US-005 — Usunięcie konta (M1/M2)
Opis: Jako użytkownik chcę trwale usunąć konto i dane.
Kryteria akceptacji:

1. Akcja wymaga potwierdzenia (np. wpisanie DELETE).
2. Usunięte: fiszki, zestawy, dane profilu; logi sesji zgodnie z polityką retencji.
3. Po sukcesie nie mogę się zalogować poprzednimi danymi.

US-006 — Utworzenie zestawu (M1)
Opis: Jako użytkownik chcę utworzyć nowy zestaw, aby organizować fiszki.
Kryteria akceptacji:

1. Nazwa zestawu jest wymagana i unikalna w obrębie konta.
2. Po utworzeniu zestaw pojawia się na liście.

US-007 — Zmiana nazwy/usunięcie zestawu (M1)
Opis: Jako użytkownik chcę zmienić nazwę zestawu lub go usunąć.
Kryteria akceptacji:

1. Zmiana nazwy aktualizuje widok listy i szczegółów.
2. Usunięcie wymaga potwierdzenia; jeśli zestaw nie jest pusty, wymagaj dodatkowego potwierdzenia lub blokady zgodnie z decyzją projektową.
3. Fiszki w usuniętym zestawie: usuwane lub przenoszone zgodnie z potwierdzeniem użytkownika.

US-008 — Ręczne tworzenie fiszki (M1)
Opis: Jako użytkownik chcę dodać fiszkę front/back do wybranego zestawu.
Kryteria akceptacji:

1. Wymagane pola front i back; walidacja pustych wartości.
2. Po zapisie karta widoczna na liście zestawu.
3. Deduplikacja wewnątrz zestawu wg znormalizowanego frontu (do decyzji: ostrzeżenie lub blokada).

US-009 — Edycja fiszki (M1)
Opis: Jako użytkownik chcę edytować istniejącą fiszkę.
Kryteria akceptacji:

1. Edycja front/back zapisuje się i aktualizuje listę.
2. Historia zmian nie jest wymagana w MVP.

US-010 — Usunięcie fiszki (M1)
Opis: Jako użytkownik chcę usunąć fiszkę.
Kryteria akceptacji:

1. Akcja wymaga potwierdzenia.
2. Po usunięciu karta znika z listy; licznik w zestawie aktualizowany.

US-011 — Przegląd fiszek w zestawie (M1)
Opis: Jako użytkownik chcę przeglądać fiszki w wybranym zestawie.
Kryteria akceptacji:

1. Widok listy.
2. Paginacja lub infinite scroll; stan przewijania zachowany przy powrocie.

US-012 — Wklejenie tekstu do generowania (M2)
Opis: Jako użytkownik chcę wkleić tekst (od 1000 do 10 000 znaków) jako źródło do generowania kart.
Kryteria akceptacji:

1. Licznik znaków i walidacja limitu (1000-10000 znaków) z czytelnym komunikatem.
2. Pusty lub zbyt krótki input blokuje Generuj.

US-013 — Konfiguracja generowania (M2)
Opis: Jako użytkownik chcę ustawić liczbę kart suwakem i filtry podstawowe.
Kryteria akceptacji:

1. Suwak ma określony zakres i wartość domyślną.
2. Zmiany filtrów/suwaka wpływają na liczbę i typ propozycji.
3. Kierunek tłumaczenia EN↔PL możliwy do wyboru (jeśli automatyka nie zadziała).

US-014 — Generowanie i triage w modalu (M2)
Opis: Jako użytkownik chcę hurtowo przejrzeć propozycje, edytować inline i odznaczać niechciane.
Kryteria akceptacji:

1. Wszystkie propozycje domyślnie zaznaczone.
2. Edycje inline zapisują się przed confirm.
3. Odznaczone nie są tworzone.
4. Brak skrótów klawiaturowych i zaznacz/odznacz wszystkie w MVP.

US-015 — Zatwierdzenie propozycji (confirm) (M2)
Opis: Jako użytkownik chcę potwierdzić wybór, aby utworzyć fiszki w zestawie.
Kryteria akceptacji:

1. Po confirm fiszki są utworzone i widoczne w zestawie.
2. Źródło wejściowe jest trwale usuwane.
3. Sesja generowania zapisana w logu z metrykami.
4. Zamknięcie modalu bez confirm nie tworzy fiszek ani nie wlicza sesji do statystyki.

US-016 — Obsługa błędów generowania (M2)
Opis: Jako użytkownik chcę otrzymywać czytelne komunikaty przy błędach/timeoutach i móc ponowić lub anulować.
Kryteria akceptacji:

1. Timeout/5xx → komunikat z opcją Ponów/Anuluj.
2. Anulowanie zamyka sesję bez utworzenia fiszek i bez liczenia do metryk.
3. Częściowe wyniki mogą być pokazane z etykietą Niepełne.

US-017 — Nauka znam/nie znam (M3)
Opis: Jako użytkownik chcę oznaczać fiszki jako znane/nieznane i filtrować widok.
Kryteria akceptacji:

1. Akcje znam/nie znam są dostępne na karcie.
2. Filtr przełącza widok: tylko nieznane / wszystkie.
3. Stan jest zapisywany per karta.

US-018 — Nauka z algorytmem SRS (M4)
Opis: Jako użytkownik chcę uczyć się wg harmonogramu SRS.
Kryteria akceptacji:

1. System wyznacza codzienną pulę powtórek wg SM-2 (lub równoważnego open-source).
2. Odpowiedzi użytkownika aktualizują easiness/interval zgodnie z algorytmem.
3. Historia powtórek dostępna w minimalnym podglądzie.

US-019 — Podgląd statystyk sesji generowania (M2)
Opis: Jako użytkownik chcę zobaczyć metryki ostatniej sesji (Accept Rate, liczby).
Kryteria akceptacji:

1. Ekran/sekcja pokazuje accepted, rejected, edited i Accept Rate.
2. Sesje zamknięte bez confirm nie są uwzględniane.

US-020 — Deduplikacja kandydatów (M2)
Opis: Jako użytkownik nie chcę widzieć zduplikowanych propozycji w triage.
Kryteria akceptacji:

1. System wykrywa duplikaty w obrębie sesji i łączy/ukrywa je.
2. W przypadku konfliktów pokazuje jedną propozycję z informacją o scaleniu.

US-021 — Przekroczenie lub niedosiągnięcie limitu wejścia (M2)
Opis: Jako użytkownik chcę jasnego komunikatu po przekroczeniu 10 000 znaków lub gdy tekst jest krótszy niż 1000 znaków.
Kryteria akceptacji:

1. Komunikat podaje bieżącą liczbę znaków i informuje o przekroczeniu górnego limitu lub niedosiągnięciu dolnego.
2. Przycisk Generuj jest nieaktywny, dopóki długość tekstu nie znajdzie się w wymaganym zakresie.

US-022 — Anulowanie sesji triage (M2)
Opis: Jako użytkownik chcę móc bezpiecznie zamknąć modal triage bez utraty istniejących danych konta.
Kryteria akceptacji:

1. Zamknięcie modalu nie tworzy fiszek i nie zapisuje sesji.
2. Po ponownym otwarciu procesu startuję od nowa.

US-023 — Podstawowe filtrowanie kandydatów (M2)
Opis: Jako użytkownik chcę pominąć nazwy własne/liczby i zbyt długie frazy.
Kryteria akceptacji:

1. Włączenie/wyłączenie filtra wpływa na listę propozycji.
2. Domyślne ustawienia są jasno opisane.

US-024 — Wybór zestawu docelowego przy confirm (M2)
Opis: Jako użytkownik chcę wskazać zestaw, do którego trafią zaakceptowane fiszki.
Kryteria akceptacji:

1. Domyślnie ostatnio używany zestaw; możliwość zmiany.
2. Po confirm karty lądują w wybranym zestawie.

US-025 — Podgląd liczby powstałych kart (M2)
Opis: Jako użytkownik chcę widzieć licznik zaznaczonych/zaakceptowanych przed confirm.
Kryteria akceptacji:

1. Licznik aktualizuje się przy edycji/odznaczaniu.
2. Brak rozjazdów z finalnie utworzonymi kartami.

US-026 — Dostęp tylko do swoich danych (M1)
Opis: Jako użytkownik chcę mieć pewność, że widzę tylko swoje zestawy i fiszki.
Kryteria akceptacji:

1. Każde zapytanie do API uwzględnia identyfikator użytkownika.
2. Próba dostępu do cudzych zasobów zwraca 403/404.
3. Niezalogowany użytkownik jest automatycznie przekierowany na stronę logowania przy próbie dostępu do chronionych zasobów.
4. Wygasła sesja powoduje przekierowanie na stronę logowania z komunikatem.

## 6. Metryki sukcesu

6.1. Metryki produktowe (kluczowe)

* CS1: Accept Rate per sesja generowania ≥ 75%.
  Definicja: Accept Rate = accepted/(accepted+rejected); edycje liczą się jako accepted; sesje bez confirm wyłączone.
* CS2: ≥ 75% fiszek powstaje z użyciem AI.
  Definicja: Udział fiszek utworzonych przez AI vs manual w oknie czasowym (rekomendacja: kroczące 30 dni; dokładne okno do decyzji).

6.2. Metryki operacyjne

* P95 czasu generacji dla X kart (np. 20) w M2: cel do ustalenia po pierwszych pomiarach.
* Współczynnik błędów generowania (timeout/HTTP 5xx) per 100 sesji.
* Koszt na sesję i na użytkownika (monitoring) z alertami progowymi.
* Stabilność: błędy krytyczne < określony próg/tydzień w M2+.
* Użycie funkcji: udział użytkowników, którzy korzystają z triage ≥ określony próg po N dniach od rejestracji.

Lista kontrolna jakości PRD

* Każda historyjka ma jasne, testowalne kryteria akceptacji.
* Kryteria akceptacji są konkretne i weryfikowalne.
* Zestaw historyjek pokrywa pełną funkcjonalność M1–M4 (auth, CRUD, generowanie, nauka, SRS, błędy, limity).
* Uwzględniono wymagania uwierzytelniania i autoryzacji.
