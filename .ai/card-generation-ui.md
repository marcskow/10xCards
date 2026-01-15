# 10xCards: AI Flashcard Generation Plan (M2)

This document outlines the implementation strategy for the AI-powered flashcard generation module, utilizing OpenRouter.ai for model flexibility and Astro/React for the user interface.

## 1. AI & API Architecture

The backend logic is distributed across two primary Astro server endpoints that interface with OpenRouter.ai and Supabase.

### A. Endpoint: Generate Proposals
- **Route**: `POST /api/generation/proposals`
- **Validation**:
    - Input text must be between 1,000 and 10,000 characters.
    - Uses Zod for schema validation.
- **AI Integration (OpenRouter)**:
    - Sends a structured prompt to OpenRouter.ai to extract flashcards from the provided text.
    - Configurable models (e.g., GPT-4o mini or Claude 3.5 Sonnet) via environment variables to control costs and quality.
- **Response**: Returns a `GenerateProposalsDto` containing temporary `CardProposal` objects.

### B. Endpoint: Confirm Triage Session
- **Route**: `POST /api/generation/confirm`
- **Functionality**:
    - Performs a bulk-insert of accepted cards into the `public.cards` table.
    - Logs session metrics (input size, accepted/rejected/edited counts) into the `public.generation_sessions` table.
    - Calculates the "Accept Rate" to monitor AI performance.
- **Security**: Relies on Supabase RLS to ensure the `setId` belongs to the authenticated user.

## 2. UI & UX Structure

The UI is a hybrid of Astro layouts and interactive React "islands" for complex state management.

### A. View: AI Generation (Text Import)
- **Path**: `/generate`
- **Key Features**:
    - **Textarea**: Large input field with real-time character count feedback.
    - **Set Selection**: Dropdown to choose the destination flashcard set.
    - **Constraints**: "Generate" button remains disabled until text length requirements (1k-10k) are met.

### B. View: Triage Modal (React Island)
- **Component**: `TriageModal`
- **Interactive Logic**:
    - **Review & Selection**: Displays proposals with checkboxes (all selected by default).
    - **Inline Editing**: Users can click text fields to modify front/back content before confirming.
    - **Live Counters**: Displays the current count of cards selected for creation.
- **State Management**: Uses React Context or hooks to track edits and deletions within the session.

## 3. Data Flow & Source Tracking

1. **Generation**: AI generates candidates; they are assigned a source of `ai`.
2. **Review**: If a user edits a proposal in the Triage Modal, the source is updated to `ai_edited`.
3. **Storage**: Upon confirmation, cards are persisted to the database and the original source text is deleted to maintain privacy and reduce storage.

## 4. Error Handling & Edge Cases

| Scenario | UX/API Response |
| :--- | :--- |
| **OpenRouter Failure** | A Toast notification appears with a "Retry" option for the user. |
| **Duplicate Card** | The API returns a `400 Bad Request` if a card with the same "front" exists in the set; the UI displays an inline error. |
| **Session Abort** | Closing the Triage Modal without confirming wipes the temporary state and does not create cards or log metrics. |
| **Insufficient Text** | The UI blocks submission if text is under 1,000 characters to ensure the AI has enough context to generate quality cards. |
