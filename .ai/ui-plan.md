# UI Architecture for 10xCards

## 1. UI Structure Overview

The user interface for 10xCards will be a responsive web application built with Astro and React "islands" for interactive components. The architecture is designed around a few key views that guide the user through creating, managing, and studying flashcard sets. The core of the application revolves around two main user flows: manual card/set management and AI-powered card generation from text. Navigation will be straightforward, with a main dashboard listing all sets and clear pathways to set details and the card generation feature. The UI will utilize the Shadcn/ui component library to ensure a consistent, accessible, and responsive experience. For the MVP, user authentication is deferred in favor of a hardcoded `DEFAULT_USER_ID`.

## 2. View List

### View: Main Dashboard
-   **View Path**: `/`
-   **Main Purpose**: To provide users with an overview of all their flashcard sets and serve as the primary entry point for creating new sets or generating cards with AI.
-   **Key Information to Display**:
    -   Paginated list of existing card sets with their names.
    -   A primary "Generate Cards" call-to-action button.
    -   A secondary "Create New Set" button.
-   **Key View Components**:
    -   `SetList`: A component to display the list of sets.
    -   `PaginationControls`: For navigating through the list of sets.
    -   `Button`: For the "Generate Cards" and "Create New Set" actions.
    -   `Header`: Containing the application title and navigation.
-   **UX, Accessibility, and Security Considerations**:
    -   **UX**: The view should load quickly, using client-side caching for the set list. A clear visual hierarchy should guide the user toward the primary action (Generate Cards).
    -   **Accessibility**: The list should be keyboard-navigable. All interactive elements (buttons, links) must have accessible labels.
    -   **Security**: N/A for MVP, as all operations use a default user ID.

### View: Set Detail View
-   **View Path**: `/sets/{setId}`
-   **Main Purpose**: To display and manage all the flashcards within a specific set.
-   **Key Information to Display**:
    -   The name of the set.
    -   A list of all cards in the set, showing the "front" and "back" content.
    -   Visual indicators for card source (manual, AI-generated, AI-edited).
    -   A message and CTAs ("Add a card manually," "Generate cards with AI") if the set is empty.
-   **Key View Components**:
    -   `CardList`: Displays the cards with controls for editing and deleting.
    -   `CardListItem`: Represents a single card in the list.
    -   `EmptySetPlaceholder`: The component shown for new, empty sets.
    -   `Button`: For adding a new card.
    -   `EditCardModal`: A modal form for editing an existing card.
    -   `CreateCardModal`: A modal form for creating a new card manually.
-   **UX, Accessibility, and Security Considerations**:
    -   **UX**: Inline editing or a quick-to-open modal for card edits will streamline the management process. Deletion should require confirmation.
    -   **Accessibility**: Card lists should be navigable and editable using a keyboard. Modals must trap focus and be dismissible with the `Esc` key.
    -   **Security**: All actions (view, edit, delete) are scoped to the `DEFAULT_USER_ID` on the backend.

### View: AI Generation (Text Import)
-   **View Path**: `/generate`
-   **Main Purpose**: To allow users to input a block of text from which AI will generate flashcard proposals.
-   **Key Information to Display**:
    -   A large text area for pasting content.
    -   Instructions on character limits (1,000-10,000).
    -   A dropdown to select the target set for the new cards.
    -   A "Generate" button to start the process.
-   **Key View Components**:
    -   `Textarea`: For the main text input.
    -   `Select`: For choosing the destination set.
    -   `Button`: To submit the text for generation.
    -   `TriageModal`: A complex modal to display, edit, and confirm the AI-generated proposals.
-   **UX, Accessibility, and Security Considerations**:
    -   **UX**: The view should provide real-time feedback on character count. A loading indicator is crucial while waiting for AI proposals. The Triage Modal is the most complex part of the UI and needs to be intuitive.
    -   **Accessibility**: The text area and select dropdown must be labeled. The Triage Modal must be fully keyboard-accessible, allowing users to navigate between proposals, edit them, and (de)select them.
    -   **Security**: The input text is sent to the backend and should be handled securely, though it is only stored temporarily.

## 3. User Journey Map

### Main Use Case: AI Card Generation

1.  **Start**: The user lands on the **Main Dashboard (`/`)**.
2.  **Initiate Generation**: The user clicks the "Generate Cards" button.
3.  **Navigate to Import**: The user is navigated to the **AI Generation (Text Import) View (`/generate`)**.
4.  **Input Text**: The user pastes their desired text into the text area and selects a target set.
5.  **Submit**: The user clicks "Generate." The UI shows a loading state while the backend processes the request (`POST /api/generation/proposals`).
6.  **Triage Proposals**: Upon receiving a successful response, the **Triage Modal** opens, displaying the list of AI-generated card proposals. All proposals are selected by default.
7.  **Review and Edit**: The user reviews the proposals. They can uncheck any they wish to discard and click into any card's front or back to make inline edits.
8.  **Confirm Creation**: The user clicks the "Create Cards" button in the modal. The UI sends the selected (and edited) proposals to the backend (`POST /api/generation/confirm`).
9.  **Redirection**: After the cards are successfully created, the user is redirected to the **Set Detail View (`/sets/{setId}`)** for the target set, where they can see the newly added cards.

### Edge Cases:

-   **API Error during Generation**: If the call to `/api/generation/proposals` fails, a toast notification appears with a "Retry" option.
-   **Empty Set**: When a user navigates to a **Set Detail View** for a set with no cards, a special placeholder is shown with buttons to "Add a card manually" or "Generate cards with AI."
-   **Data Conflict**: If a user tries to create a card that already exists (or a set with a duplicate name), the API will return a `400 Bad Request`. The UI will display a specific inline error message on the relevant form field.

## 4. Layout and Navigation Structure

-   **Main Layout**: A single, consistent layout (`Layout.astro`) will wrap all views. It will contain a simple header with the application name ("10xCards") and a link back to the Main Dashboard.
-   **Navigation Flow**:
    -   The root path (`/`) is the **Main Dashboard**, listing all sets.
    -   Clicking on a set name in the dashboard navigates the user to the **Set Detail View** (`/sets/{setId}`).
    -   From the dashboard, the "Generate Cards" button navigates to the **AI Generation View** (`/generate`).
    -   The application uses a nested routing structure, which is intuitive and aligns with the resource hierarchy (`/sets` -> `/sets/{setId}`).

## 5. Key Components

These are reusable React components that will form the building blocks of the UI.

-   **`Button`**: A standard, accessible button from Shadcn/ui, used for all primary and secondary actions.
-   **`Toast`**: A non-intrusive notification component used for global error handling (e.g., API failures) and success messages.
-   **`Modal`**: A generic modal component used for confirmation dialogs and as a container for forms like "Create/Edit Card" and the "Triage" view. It will handle focus trapping and keyboard dismissal.
-   **`CardList` / `CardListItem`**: Components for rendering a list of flashcards. `CardListItem` will include the front/back text, visual source indicators, and controls for "Edit" and "Delete."
-   **`SetList` / `SetListItem`**: Components for rendering the list of sets on the dashboard. `SetListItem` will be a link to the `Set Detail View`.
-   **`TriageModal`**: A complex, client-side "island" component that manages the state of AI-generated card proposals. It will use React Context to handle the list of proposals, their selected state, and inline editing. This is the most state-intensive component in the MVP.
-   **`Inline-editable field`**: A text field that, on click, turns into an input and allows for quick modification of content, for example, in the triage modal.
-   **`Form`**: A component that wraps form elements and handles validation and submission logic, displaying inline error messages for specific fields.

