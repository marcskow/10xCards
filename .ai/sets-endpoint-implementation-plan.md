# API Endpoint Implementation Plan: `/api/sets`

This document provides a detailed implementation plan for the `/api/sets` REST API endpoints, covering creation, retrieval, updating, and deletion of flashcard sets.

## 1. Endpoint Overview

The `/api/sets` resource provides full CRUD (Create, Read, Update, Delete) functionality for a user's flashcard sets. All endpoints are protected and require user authentication. The logic will be separated between thin API route handlers (Astro endpoints) and a dedicated `SetService` for business logic and data access.

-   `GET /api/sets`: Lists all sets for the authenticated user with pagination.
-   `POST /api/sets`: Creates a new set for the authenticated user.
-   `GET /api/sets/{setId}`: Retrieves a single set by its ID.
-   `PATCH /api/sets/{setId}`: Updates the name of a specific set.
-   `DELETE /api/sets/{setId}`: Deletes a specific set.

## 2. Request Details

### GET `/api/sets`

-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/sets`
-   **Parameters**:
    -   **Optional (Query)**:
        -   `page` (number, default: 1): The page number for pagination.
        -   `limit` (number, default: 20): The number of items per page.
-   **Request Body**: None

### POST `/api/sets`

-   **HTTP Method**: `POST`
-   **URL Structure**: `/api/sets`
-   **Parameters**: None
-   **Request Body**: `CreateSetCommand`
    ```json
    {
      "name": "string"
    }
    ```

### GET `/api/sets/{setId}`

-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/sets/{id}`
-   **Parameters**:
    -   **Required (Path)**: `id` (string, uuid)
-   **Request Body**: None

### PATCH `/api/sets/{setId}`

-   **HTTP Method**: `PATCH`
-   **URL Structure**: `/api/sets/{id}`
-   **Parameters**:
    -   **Required (Path)**: `id` (string, uuid)
-   **Request Body**: `UpdateSetCommand`
    ```json
    {
      "name": "string"
    }
    ```

### DELETE `/api/sets/{setId}`

-   **HTTP Method**: `DELETE`
-   **URL Structure**: `/api/sets/{id}`
-   **Parameters**:
    -   **Required (Path)**: `id` (string, uuid)
-   **Request Body**: None

## 3. Used Types

The following types from `src/types.ts` will be used:

-   `PaginatedResponse<SetDto>`: For the response of `GET /api/sets`.
-   `SetDto`: The standard data transfer object for a set in responses.
-   `CreateSetCommand`: For the request body of `POST /api/sets`.
-   `UpdateSetCommand`: For the request body of `PATCH /api/sets/{setId}`.

## 4. Response Details

-   **`GET /api/sets`**:
    -   **Success (200 OK)**: `PaginatedResponse<SetDto>`
-   **`POST /api/sets`**:
    -   **Success (201 Created)**: `SetDto`
-   **`GET /api/sets/{setId}`**:
    -   **Success (200 OK)**: `SetDto`
-   **`PATCH /api/sets/{setId}`**:
    -   **Success (200 OK)**: `SetDto`
-   **`DELETE /api/sets/{setId}`**:
    -   **Success (204 No Content)**: Empty response body.

-   **Error (4xx/5xx)**:
    ```json
    {
      "error": "A descriptive error message"
    }
    ```

## 5. Data Flow

1.  An incoming request hits an Astro API route (`/src/pages/api/sets/index.ts` or `/src/pages/api/sets/[id].ts`).
2.  The Astro middleware (`src/middleware/index.ts`) runs first, validating the JWT from the `Authorization` header. If valid, it attaches the user object to `context.locals.user`. If invalid, it aborts with a `401`.
3.  The API route handler parses and validates its inputs (path parameters, query parameters, request body) using `zod`. If validation fails, it returns a `400`.
4.  The handler calls the appropriate method in the `SetService` (e.g., `setService.createSet(...)`), passing the authenticated `userId` and validated command/parameters.
5.  The `SetService` constructs and executes a query against the Supabase database using the Supabase client. All queries will include a `where('user_id', 'eq', userId)` clause to enforce data ownership.
6.  The service handles any database errors (e.g., unique constraint violation) and returns data or throws an application-specific error.
7.  The service maps the database entity (`SetEntity`) to the API DTO (`SetDto`) before returning.
8.  The API route handler catches any errors from the service, logs them, and returns the appropriate HTTP status code (e.g., `404`, `400`) and error payload.
9.  If successful, the handler returns the correct HTTP status code (`200`, `201`, `204`) and the data payload from the service.

## 6. Security Considerations

-   **Authentication**: Handled by the existing Astro middleware, which must validate the Supabase JWT on every request to these endpoints.
-   **Authorization**: The primary defense is ensuring every database query within the `SetService` is filtered by the `user_id` obtained from the authenticated session (`context.locals.user.id`). This prevents a user from accessing another user's data, even if they guess a valid UUID. The database RLS policies serve as a critical second layer of defense.
-   **Input Validation**: All incoming data (body, query params, path params) will be strictly validated using `zod` to prevent malformed data and potential injection attacks. The use of the Supabase client already protects against SQL injection.

## 7. Error Handling

-   **400 Bad Request**: Returned for failed `zod` validation or business logic violations (e.g., creating a set with a duplicate name).
-   **401 Unauthorized**: Returned by the middleware if the JWT is missing, invalid, or expired.
-   **404 Not Found**: Returned if a request targets a `setId` that does not exist or does not belong to the authenticated user.
-   **500 Internal Server Error**: Returned for unexpected server-side issues, such as a database connection failure. Errors will be logged to the console for debugging.

## 8. Performance Considerations

-   The `sets` table is expected to be relatively small for each user, so simple queries should be performant.
-   The database schema includes an index on `sets(user_id)`, which is critical for the performance of all queries made by these endpoints.
-   Pagination (`GET /api/sets`) is essential to prevent fetching large amounts of data at once. The default `limit` of 20 is a sensible starting point.

## 9. Implementation Steps

1.  **Create Service File**: Create a new file `src/lib/services/set.service.ts`.
2.  **Implement `SetService`**:
    -   Define a `SetService` class.
    -   Implement the `listSets`, `createSet`, `getSetById`, `updateSet`, and `deleteSet` methods.
    -   Each method will take a `SupabaseClient` and `userId` as arguments.
    -   Inside each method, perform the corresponding Supabase query, ensuring to filter by `user_id`.
    -   Implement mapping from `SetEntity` to `SetDto`.
    -   Handle the unique name constraint error for `createSet` and `updateSet`.
3.  **Create API Route for Collections**: Create a new file `src/pages/api/sets/index.ts`.
    -   Implement the `GET` handler to process pagination parameters, call `setService.listSets`, and return a `200` response.
    -   Implement the `POST` handler to validate the `CreateSetCommand` body, call `setService.createSet`, and return a `201` response.
4.  **Create API Route for Single Resources**: Create a new file `src/pages/api/sets/[id].ts`.
    -   Implement the `GET` handler to validate the `id` parameter, call `setService.getSetById`, and return a `200` or `404` response.
    -   Implement the `PATCH` handler to validate the `id` and `UpdateSetCommand` body, call `setService.updateSet`, and return a `200` or `404` response.
    -   Implement the `DELETE` handler to validate the `id` parameter, call `setService.deleteSet`, and return a `204` or `404` response.
5.  **Input Validation**: Use `zod` in each API route handler to define and enforce schemas for path parameters, query parameters, and request bodies.
6.  **Dependency Injection**: In each API route handler, retrieve the Supabase client from `context.locals.supabase` and instantiate the `SetService`.
7.  **Testing**: Add unit/integration tests for the service methods and API endpoints to verify correctness, error handling, and security enforcement.
