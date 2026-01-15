# View Implementation Plan: Sets List View

## 1. Overview
The **Sets List View** is the primary dashboard for users to manage their flashcard collections. It allows users to browse existing sets, create new ones, rename them, or delete them. This view serves as the entry point for both manual flashcard management and the AI generation flow.

## 2. View Routing
- **Path**: `/dashboard` or `/sets`.
- [cite_start]**Rendering Strategy**: Hybrid—Server-Side Rendered (SSR) via Astro for the initial load with React components hydrated for interactivity[cite: 6, 7].

## 3. Component Structure
- `SetsDashboard` (Astro Page)
    - `SetsHeader` (React Component)
        - `CreateSetDialog` (React Component / Shadcn/ui Dialog)
    - `SetsList` (React Component)
        - `SetCard` (React Component)
            - `SetActions` (React Component / Shadcn/ui Dropdown)
        - `Pagination` (React Component / Shadcn/ui)

## 4. Component Details

### `SetsList`
- **Component description**: Container that manages the local state of sets, handling pagination and the display of the set grid.
- **Main elements**: A grid layout containing multiple `SetCard` instances and a `Pagination` footer.
- **Handled interactions**: Switching pages, which triggers new API fetches.
- **Handled validation**: Displays a "No sets found" message if the data array is empty.
- [cite_start]**Types**: `PaginatedResponse<SetDto>`[cite: 63, 67].
- **Props**: `initialData: PaginatedResponse<SetDto>`.

### `SetCard`
- **Component description**: A visual card representing a single set, showing its name and metadata.
- **Main elements**: Set name (clickable link), creation date, and a `SetActions` dropdown.
- **Handled interactions**: Navigating to the set detail view.
- **Handled validation**: N/A.
- [cite_start]**Types**: `SetDto`[cite: 67].
- **Props**: `set: SetDto`, `onUpdate: (id: string) => void`, `onDelete: (id: string) => void`.

### `CreateSetDialog`
- **Component description**: A modal dialog containing a form to create a new flashcard set.
- [cite_start]**Main elements**: `Dialog` wrapper, `Input` for name, and a `Button` for submission[cite: 8, 9].
- **Handled interactions**: Form submission to the API.
- **Handled validation**: The name must be a non-empty string; duplicates are handled via API error responses.
- [cite_start]**Types**: `CreateSetCommand`, `SetDto`[cite: 67, 68].
- **Props**: `onCreated: (newSet: SetDto) => void`.

## 5. Types
- [cite_start]`SetDto`: The data structure for a set received from the API, including `id`, `name`, and `createdAt`[cite: 67].
- [cite_start]`CreateSetCommand`: The request body required to create a set, containing only the `name`[cite: 68].
- [cite_start]`UpdateSetCommand`: The request body for updating a set name[cite: 69].
- [cite_start]`PaginatedResponse<T>`: A generic wrapper for lists that includes the data array and pagination metadata (page, limit, total)[cite: 63].

## 6. State Management
- **Strategy**: Local state within the `SetsList` component using React's `useState` and `useEffect`.
- **Custom Hook**: A `useSets` hook will be implemented to encapsulate API calls for fetching, creating, and deleting sets.
- **State variables**:
    - `sets`: `SetDto[]` (the current list displayed).
    - `page`: `number` (current page index).
    - `total`: `number` (total sets available for pagination).
    - `isLoading`: `boolean` (loading state for API requests).

## 7. API Integration
- **Endpoint**: `GET /api/sets` - Fetches the paginated list. Request: `page`, `limit` params. Response: `PaginatedResponse<SetDto>`.
- **Endpoint**: `POST /api/sets` - Creates a new set. Request body: `CreateSetCommand`. Response: `SetDto`.
- **Endpoint**: `DELETE /api/sets/{id}` - Removes a set. Request: `id` path param. Response: `204 No Content`.

## 8. User Interactions
- **Browse Sets**: Users scroll through the grid or use pagination buttons to see more sets.
- **Create Set**: User clicks the "New Set" button, enters a name in the dialog, and submits.
- **Rename Set**: User selects "Rename" from the `SetActions` menu and provides a new name.
- **Delete Set**: User selects "Delete" and confirms the action in a confirmation prompt.

## 9. Conditions and Validation
- **Required Fields**: The `name` field in the creation/update form is mandatory.
- **Uniqueness**: The interface will display a specific error if the API returns a 400 error indicating the set name is already taken.
- **Authorization**: The view is only accessible if a valid session exists (checked via middleware and API).

## 10. Error Handling
- **API Errors**: 400/500 errors from the API will be caught and displayed using toast notifications.
- **Empty State**: If the user has no sets, a friendly message and a prominent "Create your first set" button will be shown.
- **Loading State**: Skeleton loaders will be displayed while fetching data to improve perceived performance.

## 11. Implementation Steps
1. Create the `useSets` custom hook for API interaction.
2. Build the `SetCard` and `SetActions` components using Shadcn/ui primitives.
3. Implement the `CreateSetDialog` with form validation.
4. Assemble the `SetsList` component to manage pagination logic and state.
5. Create the Astro page at `src/pages/dashboard.astro` to serve as the entry point.
6. Integrate toast notifications for success and error feedback during CRUD operations.
