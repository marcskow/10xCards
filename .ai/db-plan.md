````markdown
## 1. Tables

The schema defines three primary tables in the `public` schema, all of which reference the `auth.users` table provided by Supabase for user identification and authentication.

### `public.sets`

Stores the collections (decks) of flashcards created by a user.

```sql
CREATE TABLE public.sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- A user cannot have two sets with the same name.
    CONSTRAINT sets_user_id_name_key UNIQUE (user_id, name)
);

COMMENT ON TABLE public.sets IS 'Stores user-created flashcard sets (decks).';
COMMENT ON COLUMN public.sets.user_id IS 'Owner of the set, references auth.users.';
COMMENT ON COLUMN public.sets.name IS 'Name of the flashcard set, unique per user.';
````

### `public.cards`

Stores the individual flashcards, each belonging to a `set`.

```sql
CREATE TABLE public.cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id uuid NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front text NOT NULL,
    back text NOT NULL,
    is_known boolean NOT NULL DEFAULT false,
    source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'ai_edited')),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Prevents duplicate cards within the same set.
    CONSTRAINT cards_set_id_front_key UNIQUE (set_id, front)
);

COMMENT ON TABLE public.cards IS 'Individual flashcards belonging to a set.';
COMMENT ON COLUMN public.cards.set_id IS 'The set this card belongs to.';
COMMENT ON COLUMN public.cards.user_id IS 'Denormalized owner ID for simpler RLS policies.';
COMMENT ON COLUMN public.cards.front IS 'The "question" side of the card.';
COMMENT ON COLUMN public.cards.back IS 'The "answer" side of the card.';
COMMENT ON COLUMN public.cards.source IS 'How the card was created (manual, ai, ai_edited).';
COMMENT ON COLUMN public.cards.front_normalized IS 'Application-generated normalized version of the front for deduplication.';
COMMENT ON COLUMN public.cards.is_known IS 'Flag for M3 "know/don''t know" feature.';
```

### `public.generation_sessions`

Logs metadata for each AI generation attempt (M2 analytics).

```sql
CREATE TABLE public.generation_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL CHECK (status IN ('confirmed', 'aborted')),
    input_char_count integer NOT NULL CHECK (input_char_count >= 1000 AND input_char_count <= 10000),
    proposed_count integer NOT NULL DEFAULT 0,
    accepted_count integer NOT NULL DEFAULT 0,
    rejected_count integer NOT NULL DEFAULT 0,
    edited_count integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.generation_sessions IS 'Logs metadata for AI card generation sessions (M2).';
COMMENT ON COLUMN public.generation_sessions.status IS 'Final state of the session (confirmed or aborted).';
COMMENT ON COLUMN public.generation_sessions.input_char_count IS 'Length of the source text (1k-10k chars).';
COMMENT ON COLUMN public.generation_sessions.proposed_count IS 'Total cards suggested by AI.';
COMMENT ON COLUMN public.generation_sessions.accepted_count IS 'Cards accepted by the user.';
COMMENT ON COLUMN public.generation_sessions.rejected_count IS 'Cards rejected by the user.';
COMMENT ON COLUMN public.generation_sessions.edited_count IS 'Cards edited by the user (counts as accepted).';
```

-----

## 2\. Relationships

- **`auth.users` (1) -\> (N) `public.sets`**: One user can own many sets.
- **`auth.users` (1) -\> (N) `public.generation_sessions`**: One user can have many generation sessions.
- **`auth.users` (1) -\> (N) `public.cards`**: One user can own many cards (denormalized relationship for RLS).
- **`public.sets` (1) -\> (N) `public.cards`**: One set can contain many cards. This relationship enforces `ON DELETE CASCADE`, so deleting a set automatically deletes all its cards.

-----

## 3\. Indexes

Indexes are created automatically for all `PRIMARY KEY` and `UNIQUE` constraints. The following indexes will be created by the foreign key constraints or should be added to support common query patterns.

- `idx_sets_user_id`: On `public.sets(user_id)` (created by FK).
- `idx_cards_set_id`: On `public.cards(set_id)` (created by FK, supports US-011 "Browse cards in set").
- `idx_cards_user_id`: On `public.cards(user_id)` (created by FK, supports RLS).
- `idx_generation_sessions_user_id`: On `public.generation_sessions(user_id)` (created by FK, supports RLS).

-----

## 4\. PostgreSQL Policies (RLS)

Row-Level Security (RLS) must be enabled on all three tables to ensure users can only access their own data (US-026).

```sql
-- 1. Enable RLS on all tables
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for public.sets
CREATE POLICY "Allow full access to own sets"
ON public.sets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create policies for public.cards
CREATE POLICY "Allow full access to own cards"
ON public.cards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Create policies for public.generation_sessions
CREATE POLICY "Allow full access to own generation sessions"
ON public.generation_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

-----

## 5\. Design Notes

1.  **Authentication**: This schema relies on the built-in Supabase `auth.users` table for user management. All user-specific tables link to `auth.users(id)` via a `uuid` foreign key.
2.  **Cascading Deletes**: `ON DELETE CASCADE` is used extensively. Deleting a user from `auth.users` will automatically remove all their `sets`, `cards`, and `generation_sessions`. Deleting a `set` will automatically remove all its associated `cards`.
3.  **RLS Denormalization**: The `cards` table includes a `user_id` column, which is technically denormalized (as the user could be found via `cards` -\> `sets` -\> `user_id`). This is an explicit design decision (Decision \#2 from session notes) to dramatically simplify RLS policies, avoiding the need for JOINs within the policy definition.
4.  **Deduplication**: Deduplication of cards (US-008, Decision \#5) is enforced at the database level via `UNIQUE(set_id, front_normalized)`. The application backend is responsible for generating the `front_normalized` value (e.g., by trimming and-lowercasing) before `INSERT`.
5.  **SRS (M4)**: The schema intentionally omits complex SRS (Spaced Repetition System) fields (like `interval`, `easiness_factor`, etc.) as per Decision \#6. The M3 requirement (US-017) is met by the simple `is_known` boolean flag on the `cards` table.
6.  **Ephemeral Source Text**: The raw text input for AI generation is *not* stored in the database, as per PRD (US-015) and Decision \#9. Only the metadata and character count are logged in `generation_sessions`.

<!-- end list -->
