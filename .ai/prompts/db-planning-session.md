\<conversation\_summary\>
\<decisions\>

1.  Wszystkie encje specyficzne dla użytkownika (`sets`, `cards`, `generation_sessions`) będą zawierały kolumnę `user_id` (typu `uuid`) jako klucz obcy wskazujący na `auth.users(id)`.
2.  Zabezpieczenia na poziomie wierszy (RLS) zostaną włączone i skonfigurowane dla tabel `sets`, `cards` i `generation_sessions`, aby zapewnić, że użytkownicy mają dostęp wyłącznie do własnych danych (polityki oparte na `auth.uid()`).
3.  Usunięcie zestawu (`sets`) automatycznie usunie wszystkie powiązane z nim fiszki (`cards`) poprzez zastosowanie klauzuli `ON DELETE CASCADE` na kluczu obcym `cards(set_id)`.
4.  Nazwy zestawów (`sets.name`) będą unikalne w obrębie konta danego użytkownika, co zostanie zapewnione przez ograniczenie `UNIQUE(user_id, name)`.
5.  Deduplikacja fiszek (US-008) zostanie zaimplementowana poprzez ograniczenie `UNIQUE(set_id, front_normalized)` w tabeli `cards`. Aplikacja (Frontend/Backend) jest odpowiedzialna za proces normalizacji (np. `lower()`, `trim()`); baza danych jedynie egzekwuje unikalność na dostarczonej, znormalizowanej wartości.
6.  Modelowanie danych dla M4 (zaawansowany SRS) jest świadomie pomijane w MVP. Wymagania M3 (US-017 "znam/nie znam") zostaną zaimplementowane w najprostszy możliwy sposób, prawdopodobnie jako kolumna `is_known` (typu `boolean`) bezpośrednio w tabeli `cards`.
7.  Tabela `generation_sessions` będzie przechowywać metadane dotyczące sesji generowania AI. Będzie zawierać ograniczenie `CHECK` dla kolumny `input_char_count`, wymuszające wartość w zakresie 1000-10000.
8.  W celu optymalizacji wydajności przeglądania zestawów (US-011), na kolumnie `cards(set_id)` zostanie utworzony indeks (B-tree).
9.  Tekst źródłowy (input dla AI) nie będzie przechowywany w bazie danych (zgodnie z US-015 i rekomendacją); w tabeli `generation_sessions` zapisywane będą wyłącznie metadane (jak `input_char_count`).
10. Usunięcie konta użytkownika w `auth.users` spowoduje kaskadowe usunięcie wszystkich powiązanych danych (np. `sets`, `generation_sessions`) poprzez zastosowanie `ON DELETE CASCADE` na kluczach obcych `user_id`.

\</decisions\>

\<matched\_recommendations\>

1.  Implementacja kolumny `user_id` (typu `uuid`) w tabelach `sets`, `cards` i `generation_sessions` jako klucza obcego do `auth.users(id)` (Rekomendacja 1).
2.  Włączenie RLS dla tabel przechowujących dane użytkowników, z politykami bazującymi na `auth.uid()` (Rekomendacja 2).
3.  Zastosowanie `ON DELETE CASCADE` dla relacji `sets` -\> `cards` (Rekomendacja 3).
4.  Zastosowanie ograniczenia `UNIQUE(user_id, name)` w tabeli `sets` (Rekomendacja 4).
5.  Zastosowanie ograniczenia `UNIQUE` dla znormalizowanego frontu fiszki w obrębie zestawu (Rekomendacja 5, zmodyfikowana o przeniesienie logiki normalizacji do aplikacji).
6.  Utworzenie dedykowanej tabeli `generation_sessions` do logowania metryk M2, w tym liczników i statusu sesji (Rekomendacja 7).
7.  Utworzenie indeksu na `cards(set_id)` w celu optymalizacji zapytań filtrujących (Rekomendacja 8).
8.  Nieprzechowywanie pełnego tekstu źródłowego AI w bazie danych (Rekomendacja 9).
9.  Zastosowanie `ON DELETE CASCADE` dla wszystkich danych powiązanych z `auth.users(id)`, aby obsłużyć usuwanie konta (Rekomendacja 10).
    \</matched\_recommendations\>

\<database\_planning\_summary\>
Na podstawie analizy PRD, stacku technologicznego (Supabase/PostgreSQL) i podjętych decyzji, plan bazy danych dla MVP Cards AI koncentruje się na prostocie, ścisłym bezpieczeństwie danych i wsparciu dla kamieni milowych M1-M3.

**Kluczowe Encje i Relacje:**

1.  **`auth.users`** (Tabela wbudowana w Supabase)

      * Przechowuje dane uwierzytelniające. Jest źródłem `id` (uuid) dla wszystkich danych użytkownika. 
      * Poglądowo:
      * id: UUID PRIMARY KEY 
      * email: VARCHAR(255) NOT NULL UNIQUE 
      * encrypted_password: VARCHAR NOT NULL 
      * created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
      * confirmed_at: TIMESTAMPTZ

2.  **`sets`** (Zestawy fiszek)

      * `id` (PK, np. `uuid` lub `bigserial`)
      * `user_id` (FK do `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`)
      * `name` (`text`, `NOT NULL`)
      * `created_at` (`timestamptz`, domyślnie `now()`)
      * Ograniczenia: `UNIQUE(user_id, name)`
      * Indeksy: `(user_id)` (automatycznie przez FK, ale warto potwierdzić)

3.  **`cards`** (Fiszki)

      * `id` (PK)
      * `set_id` (FK do `sets(id)`, `ON DELETE CASCADE`, `NOT NULL`)
      * `user_id` (FK do `auth.users(id)`, `NOT NULL` - ułatwia RLS)
      * `front` (`text`, `NOT NULL`)
      * `back` (`text`, `NOT NULL`)
      * `front_normalized` (`text`, `NOT NULL` - wypełniane przez aplikację)
      * `is_known` (`boolean`, `NOT NULL`, domyślnie `false` - dla M3)
      * `created_at` (`timestamptz`, domyślnie `now()`)
      * Ograniczenia: `UNIQUE(set_id, front_normalized)`
      * Indeksy: `(set_id)` (dla US-011), `(user_id)`

4.  **`generation_sessions`** (Logi sesji generowania AI - M2)

      * `id` (PK)
      * `user_id` (FK do `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`)
      * `created_at` (`timestamptz`, domyślnie `now()`)
      * `status` (np. `text` lub `enum('confirmed', 'aborted')`, `NOT NULL`)
      * `input_char_count` (`integer`, `NOT NULL`, `CHECK (input_char_count >= 1000 AND input_char_count <= 10000)`)
      * `proposed_count` (`integer`, `NOT NULL`)
      * `accepted_count` (`integer`, `NOT NULL`)
      * `rejected_count` (`integer`, `NOT NULL`)
      * `edited_count` (`integer`, `NOT NULL`)
      * Indeksy: `(user_id)`

**Bezpieczeństwo i Skalowalność:**

  * **Bezpieczeństwo (RLS):** Jest to kluczowy wymóg (US-026). RLS zostanie włączone na tabelach `sets`, `cards` i `generation_sessions`. Wszystkie polityki `SELECT`, `INSERT`, `UPDATE`, `DELETE` będą zawierać warunek `user_id = auth.uid()`. Dodanie `user_id` do tabeli `cards` (mimo że jest powiązana z `sets`) upraszcza implementację polityki RLS dla fiszek, unikając JOIN-ów w polityce.
  * **Skalowalność:** Projekt MVP nie wymaga złożonych optymalizacji. Podstawowe indeksowanie kluczy obcych (szczególnie `cards(set_id)`) jest wystarczające dla oczekiwanych obciążeń (przeglądanie list).
    \</database\_planning\_summary\>

\<unresolved\_issues\>

1.  Należy formalnie potwierdzić, że implementacja M3 (US-017 "znam/nie znam") jako pojedyncza kolumna `is_known` (typu `boolean`, domyślnie `false`) w tabeli `cards` jest akceptowalna i wystarczająca.
2.  Należy potwierdzić, czy dodanie kolumny `user_id` do tabeli `cards` (która jest już powiązana z `sets` posiadającym `user_id`) jest akceptowalną strategią w celu uproszczenia polityk RLS.
    \</unresolved\_issues\>
    \</conversation\_summary\>
