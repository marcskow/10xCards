# REST API Plan

This document outlines the REST API for the 10xCards application, designed based on the project's PRD, database schema, and tech stack.

## 1. Resources

The API is built around three core resources, each corresponding to a database table:

-   **Sets**: Represents a collection or deck of flashcards.
    -   Database Table: `public.sets`
-   **Cards**: Represents an individual flashcard with a front and back.
    -   Database Table: `public.cards`
-   **Generation Sessions**: A resource for handling the AI-driven creation of cards. This is a logical resource that interacts with `public.cards` and `public.generation_sessions`.

## 2. Endpoints

All endpoints are prefixed with `/api` and assume the client sends JWTs for authentication.

### 2.1. Sets

Endpoints for managing flashcard sets.

---

#### List Sets

-   **Method**: `GET`
-   **Path**: `/api/sets`
-   **Description**: Retrieves all sets belonging to the authenticated user.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): For pagination.
    -   `limit` (number, optional, default: 20): For pagination.
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "createdAt": "timestamptz"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100
      }
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `401 Unauthorized`

---

#### Create Set

-   **Method**: `POST`
-   **Path**: `/api/sets`
-   **Description**: Creates a new set for the authenticated user.
-   **Request Payload**:
    ```json
    {
      "name": "string"
    }
    ```
-   **Response Payload**:
    ```json
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "timestamptz"
    }
    ```
-   **Success**: `201 Created`
-   **Errors**: `400 Bad Request` (e.g., missing name, name not unique), `401 Unauthorized`

---

#### Get Set

-   **Method**: `GET`
-   **Path**: `/api/sets/{setId}`
-   **Description**: Retrieves a single set by its ID.
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "timestamptz"
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `401 Unauthorized`, `404 Not Found`

---

#### Update Set

-   **Method**: `PATCH`
-   **Path**: `/api/sets/{setId}`
-   **Description**: Updates the name of a specific set.
-   **Request Payload**:
    ```json
    {
      "name": "string"
    }
    ```
-   **Response Payload**:
    ```json
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "timestamptz"
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

---

#### Delete Set

-   **Method**: `DELETE`
-   **Path**: `/api/sets/{setId}`
-   **Description**: Deletes a set and all its associated cards (due to `ON DELETE CASCADE`).
-   **Request Payload**: None
-   **Response Payload**: None
-   **Success**: `204 No Content`
-   **Errors**: `401 Unauthorized`, `404 Not Found`

### 2.2. Cards

Endpoints for managing individual flashcards within a set.

---

#### List Cards in a Set

-   **Method**: `GET`
-   **Path**: `/api/sets/{setId}/cards`
-   **Description**: Retrieves all cards within a specific set.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): For pagination.
    -   `limit` (number, optional, default: 20): For pagination.
    -   `is_known` (boolean, optional): Filter by known status.
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "front": "string",
          "back": "string",
          "isKnown": false,
          "source": "manual",
          "createdAt": "timestamptz"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 50
      }
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `401 Unauthorized`, `404 Not Found` (if set does not exist)

---

#### Create Card

-   **Method**: `POST`
-   **Path**: `/api/sets/{setId}/cards`
-   **Description**: Manually creates a new card in a specific set.
-   **Request Payload**:
    ```json
    {
      "front": "string",
      "back": "string"
    }
    ```
-   **Response Payload**:
    ```json
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "isKnown": false,
      "source": "manual",
      "createdAt": "timestamptz"
    }
    ```
-   **Success**: `201 Created`
-   **Errors**: `400 Bad Request` (e.g., missing fields, duplicate front), `401 Unauthorized`, `404 Not Found`

---

#### Update Card

-   **Method**: `PATCH`
-   **Path**: `/api/cards/{cardId}`
-   **Description**: Updates a card's content or status.
-   **Request Payload**:
    ```json
    {
      "front": "string", // optional
      "back": "string", // optional
      "is_known": true // optional
    }
    ```
-   **Response Payload**:
    ```json
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "isKnown": true,
      "source": "manual", // or "ai_edited" if applicable
      "createdAt": "timestamptz"
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

---

#### Delete Card

-   **Method**: `DELETE`
-   **Path**: `/api/cards/{cardId}`
-   **Description**: Deletes a single card.
-   **Request Payload**: None
-   **Response Payload**: None
-   **Success**: `204 No Content`
-   **Errors**: `401 Unauthorized`, `404 Not Found`

### 2.3. AI Generation

Endpoints for the AI card generation and triage process.

---

#### Generate Card Proposals

-   **Method**: `POST`
-   **Path**: `/api/generation/proposals`
-   **Description**: Submits a block of text to the AI to get a list of proposed flashcards. This is a synchronous but potentially long-running operation.
-   **Request Payload**:
    ```json
    {
      "text": "string",
      "targetCardCount": 20
    }
    ```
-   **Response Payload**:
    ```json
    {
      "proposals": [
        {
          "id": "client-generated-uuid", // A temporary ID for the client to track edits
          "front": "suggested word or phrase",
          "back": "suggested translation"
        }
      ],
      "metadata": {
        "inputCharCount": 5000,
        "proposedCount": 25
      }
    }
    ```
-   **Success**: `200 OK`
-   **Errors**: `400 Bad Request` (e.g., text length outside 1k-10k chars), `401 Unauthorized`, `500 Internal Server Error` (if AI service fails)

---

#### Confirm Triage Session

-   **Method**: `POST`
-   **Path**: `/api/generation/confirm`
-   **Description**: Confirms the user's selection from the triage process. This endpoint creates the accepted cards in the database and logs the session metadata.
-   **Request Payload**:
    ```json
    {
      "setId": "uuid",
      "cards": [
        { "front": "string", "back": "string" }, // Accepted card
        { "front": "string", "back": "string" }  // Accepted and possibly edited card
      ],
      "session": {
        "inputCharCount": 5000,
        "proposedCount": 25,
        "acceptedCount": 18,
        "rejectedCount": 7,
        "editedCount": 3
      }
    }
    ```
-   **Response Payload**:
    ```json
    {
      "message": "Session confirmed. 18 cards created.",
      "createdCardsCount": 18,
      "sessionId": "uuid"
    }
    ```
-   **Success**: `201 Created`
-   **Errors**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found` (if `setId` is invalid)

## 3. Authentication and Authorization

-   **Authentication**: The API will use JSON Web Tokens (JWTs) provided by Supabase Auth. Every request to a protected endpoint must include an `Authorization: Bearer <token>` header.
-   **Implementation**: An Astro middleware (`src/middleware/index.ts`) will intercept incoming requests. It will validate the JWT using the Supabase client and attach the user's identity to the request context (`context.locals.user`). If the token is missing or invalid, the middleware will return a `401 Unauthorized` response.
-   **Authorization**: Row-Level Security (RLS) is enabled on all tables (`sets`, `cards`, `generation_sessions`). All policies are configured to ensure that `auth.uid()` matches the `user_id` on the row being accessed. This is the primary mechanism for ensuring users can only access their own data (US-026). The API backend relies on these database-level policies and does not need to re-implement this logic.

## 4. Validation and Business Logic

-   **Validation**: Input validation will be handled using `zod`. Each endpoint will define a schema for its request body and query parameters. If validation fails, the API will return a `400 Bad Request` response with a descriptive error message.
    -   `POST /api/sets`: `name` must be a non-empty string.
    -   `POST /api/sets/{setId}/cards`: `front` and `back` must be non-empty strings.
    -   `POST /api/generation/proposals`: `text` length must be between 1,000 and 10,000 characters.
-   **Business Logic**:
    -   **Card Deduplication**: The `UNIQUE(set_id, front)` constraint on the `cards` table prevents duplicate cards within a set. The API will catch the resulting database error and return a `400 Bad Request` to the user.
    -   **Set Name Uniqueness**: The `UNIQUE(user_id, name)` constraint on the `sets` table is handled similarly.
    -   **AI Generation Flow**: The logic is split between two endpoints:
        1.  `/api/generation/proposals`: Acts as a "dry run". It calls the AI service but does not persist anything to the database.
        2.  `/api/generation/confirm`: Acts as the commit step. It performs two main actions within a single database transaction:
            -   Bulk-inserts the `cards` into the `public.cards` table.
            -   Inserts a single record into the `public.generation_sessions` table with the final metrics.
    -   **Card Source Tracking**: When a card is updated via `PATCH /api/cards/{cardId}`, if its original `source` was `ai`, the backend logic should update it to `ai_edited`.
