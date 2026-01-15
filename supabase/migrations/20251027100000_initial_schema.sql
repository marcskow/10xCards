-- /******************************************************************
--  * Migration: Initial Schema Setup
--  *
--  * Description:
--  * This migration establishes the initial database schema for the 10xCards
--  * application. It creates the core tables for managing flashcard sets,
--  * individual cards, and AI generation sessions. It also configures
--  * Row-Level Security (RLS) to ensure data privacy and ownership.
--  *
--  * Affected Tables:
--  * - public.sets
--  * - public.cards
--  * - public.generation_sessions
--  *
--  * Security Considerations:
--  * - RLS is enabled on all tables to enforce data access rules.
--  * - Policies are defined to grant users access only to their own data.
--  * - The `anon` role is denied all access by default as no policies are created for it.
--  ******************************************************************/

-- ==== Table: public.sets ====
-- stores user-created flashcard sets (decks).
create table public.sets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),

    -- a user cannot have two sets with the same name.
    constraint sets_user_id_name_key unique (user_id, name)
);

-- add comments to the table and columns for clarity.
comment on table public.sets is 'stores user-created flashcard sets (decks).';
comment on column public.sets.user_id is 'owner of the set, references auth.users.';
comment on column public.sets.name is 'name of the flashcard set, unique per user.';

-- ==== Table: public.cards ====
-- stores the individual flashcards, each belonging to a `set`.
create table public.cards (
    id uuid primary key default gen_random_uuid(),
    set_id uuid not null references public.sets(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    front text not null,
    back text not null,
    is_known boolean not null default false,
    source text not null default 'manual' check (source in ('manual', 'ai', 'ai_edited')),
    created_at timestamptz not null default now(),

    -- prevents duplicate cards within the same set.
    constraint cards_set_id_front_key unique (set_id, front)
);

-- add comments to the table and columns for clarity.
comment on table public.cards is 'individual flashcards belonging to a set.';
comment on column public.cards.set_id is 'the set this card belongs to.';
comment on column public.cards.user_id is 'denormalized owner id for simpler rls policies.';
comment on column public.cards.front is 'the "question" side of the card.';
comment on column public.cards.back is 'the "answer" side of the card.';
comment on column public.cards.source is 'how the card was created (manual, ai, ai_edited).';
comment on column public.cards.is_known is 'flag for m3 "know/don''t know" feature.';

-- ==== Table: public.generation_sessions ====
-- logs metadata for each ai generation attempt.
create table public.generation_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    status text not null check (status in ('confirmed', 'aborted')),
    input_char_count integer not null check (input_char_count >= 1000 and input_char_count <= 10000),
    proposed_count integer not null default 0,
    accepted_count integer not null default 0,
    rejected_count integer not null default 0,
    edited_count integer not null default 0
);

-- add comments to the table and columns for clarity.
comment on table public.generation_sessions is 'logs metadata for ai card generation sessions (m2).';
comment on column public.generation_sessions.status is 'final state of the session (confirmed or aborted).';
comment on column public.generation_sessions.input_char_count is 'length of the source text (1k-10k chars).';
comment on column public.generation_sessions.proposed_count is 'total cards suggested by ai.';
comment on column public.generation_sessions.accepted_count is 'cards accepted by the user.';
comment on column public.generation_sessions.rejected_count is 'cards rejected by the user.';
comment on column public.generation_sessions.edited_count is 'cards edited by the user (counts as accepted).';


-- ==== Row-Level Security (RLS) ====
-- enable rls on all tables to ensure data privacy.

alter table public.sets enable row level security;
alter table public.cards enable row level security;
alter table public.generation_sessions enable row level security;

-- ==== Policies for public.sets ====
-- policies to control access to the sets table.

-- authenticated users can select their own sets.
create policy "sets_auth_select"
on public.sets for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can insert their own sets.
create policy "sets_auth_insert"
on public.sets for insert
to authenticated
with check (auth.uid() = user_id);

-- authenticated users can update their own sets.
create policy "sets_auth_update"
on public.sets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- authenticated users can delete their own sets.
create policy "sets_auth_delete"
on public.sets for delete
to authenticated
using (auth.uid() = user_id);


-- ==== Policies for public.cards ====
-- policies to control access to the cards table.

-- authenticated users can select their own cards.
create policy "cards_auth_select"
on public.cards for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can insert their own cards.
create policy "cards_auth_insert"
on public.cards for insert
to authenticated
with check (auth.uid() = user_id);

-- authenticated users can update their own cards.
create policy "cards_auth_update"
on public.cards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- authenticated users can delete their own cards.
create policy "cards_auth_delete"
on public.cards for delete
to authenticated
using (auth.uid() = user_id);


-- ==== Policies for public.generation_sessions ====
-- policies to control access to the generation_sessions table.

-- authenticated users can select their own sessions.
create policy "generation_sessions_auth_select"
on public.generation_sessions for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can insert their own sessions.
create policy "generation_sessions_auth_insert"
on public.generation_sessions for insert
to authenticated
with check (auth.uid() = user_id);

-- authenticated users can update their own sessions.
create policy "generation_sessions_auth_update"
on public.generation_sessions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- authenticated users can delete their own sessions.
create policy "generation_sessions_auth_delete"
on public.generation_sessions for delete
to authenticated
using (auth.uid() = user_id);
