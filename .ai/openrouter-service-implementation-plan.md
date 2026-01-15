# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` is a TypeScript module responsible for all interactions with the OpenRouter AI API. It will provide a streamlined interface for sending chat completion requests, handling various models and parameters, and processing structured JSON responses. This service will encapsulate the complexity of the OpenRouter API, providing a simple and robust method for other parts of the application to leverage LLM capabilities. It will be designed to be used server-side within Astro API routes and middleware.

## 2. Constructor Description

The service will not be instantiated as a class. Instead, it will be a collection of exported functions from a file, following a functional programming paradigm. This approach is lightweight and fits well with the service-oriented architecture in `src/lib/services`. Configuration, such as the API key, will be handled via environment variables, eliminating the need for a constructor or an `init` method.

**Configuration via Environment Variables:**

-   `OPENROUTER_API_KEY`: **Required**. The API key for authenticating with the OpenRouter API. The service will throw an error if this is not set.
-   `OPENROUTER_DEFAULT_MODEL`: **Optional**. The default model to use for chat completions if not specified in the request. Defaults to a sensible choice like `openai/gpt-3.5-turbo`.

## 3. Public Methods and Fields

The service will be located at `src/lib/services/openrouter.service.ts`.

### `chat(options: ChatOptions): Promise<ChatResponse>`

This is the primary method of the service. It sends a collection of messages to the OpenRouter API and returns the model's response.

**Parameters:**

-   `options` (`ChatOptions`): An object containing the parameters for the chat completion.

    ```typescript
    import { z } from 'zod';

    // Define Zod schema for the structured response
    export const FlashcardSchema = z.object({
      term: z.string().describe("The term or concept to be learned"),
      definition: z.string().describe("A clear and concise definition of the term"),
    });

    export const FlashcardSetSchema = z.object({
      flashcards: z.array(FlashcardSchema).describe("An array of generated flashcards"),
    });

    // Type for chat messages
    export type ChatMessage = {
      role: 'user' | 'assistant' | 'system';
      content: string;
    };

    // Type for chat options
    export type ChatOptions = {
      messages: ChatMessage[];
      systemMessage?: string;
      model?: string; // e.g., 'openai/gpt-4o', 'google/gemini-pro'
      responseSchema?: {
        name: string;
        schema: z.ZodObject<any>;
      };
      temperature?: number; // 0.0 - 2.0
      maxTokens?: number;
    };

    // Type for the response
    export type ChatResponse<T = any> = {
      success: true;
      data: T;
    } | {
      success: false;
      error: {
        message: string;
        code?: string;
      };
    };
    ```

**Returns:**

-   A `Promise` that resolves to a `ChatResponse` object.
    -   If successful (`success: true`), the `data` property will contain the parsed JSON response from the model if a `responseSchema` was provided, or the raw text content otherwise.
    -   If an error occurs (`success: false`), the `error` property will contain a descriptive message and an optional error code.

## 4. Private Methods and Fields

Internal helper functions will be used to keep the public `chat` method clean and maintainable. These will not be exported from the module.

### `_getApiKey(): string`

-   **Description:** Retrieves the OpenRouter API key from environment variables (`import.meta.env.OPENROUTER_API_KEY`).
-   **Error Handling:** Throws a `MissingApiKeyError` if the environment variable is not set.

### `_buildRequestBody(options: ChatOptions): object`

-   **Description:** Constructs the request body for the OpenRouter API call based on the provided `ChatOptions`. It will assemble the `messages` array (prepending the system message if provided), set the model, and correctly format the `response_format` parameter if a `responseSchema` is given.
-   **Functionality:**
    1.  Prepends the `systemMessage` to the `messages` array.
    2.  Sets the `model` from `options.model` or the default from `import.meta.env.OPENROUTER_DEFAULT_MODEL`.
    3.  If `options.responseSchema` is provided, it converts the Zod schema into the JSON schema format required by OpenRouter and creates the `response_format` object.
    4.  Includes other parameters like `temperature` and `max_tokens`.

### `_parseResponse(apiResponse: any, responseSchema?: z.ZodObject<any>): any`

-   **Description:** Parses the response from the OpenRouter API.
-   **Functionality:**
    1.  Extracts the message content from `apiResponse.choices[0].message.content`.
    2.  If `responseSchema` was used, it safely parses the JSON string using `JSON.parse()` inside a `try-catch` block.
    3.  It then validates the parsed JSON against the provided Zod `responseSchema` using `schema.safeParse()`.
    4.  If parsing or validation fails, it throws a `ResponseParseError`.
    5.  If no schema was provided, it returns the raw text content.

## 5. Error Handling

The service will implement robust error handling to manage various failure scenarios gracefully. All errors originating from the service will be instances of custom error classes (e.g., `OpenRouterError`). The public `chat` method will catch these errors and return a `ChatResponse` object with `success: false`.

**Potential Error Scenarios:**

1.  **Missing API Key:** The `OPENROUTER_API_KEY` environment variable is not set.
2.  **Network Error:** The `fetch` call fails due to network issues (e.g., no internet connection, DNS failure).
3.  **API Authentication Error:** The provided API key is invalid (HTTP 401).
4.  **API Rate Limit Error:** The rate limit for the API has been exceeded (HTTP 429).
5.  **API Invalid Request Error:** The request payload is malformed or contains invalid parameters (HTTP 400).
6.  **API Server Error:** The OpenRouter API experiences an internal server error (HTTP 5xx).
7.  **Response Parsing Error:** The model's response is not valid JSON when a structured response is expected.
8.  **Response Validation Error:** The model's JSON response does not conform to the requested Zod schema.

## 6. Security Considerations

1.  **API Key Management:** The `OPENROUTER_API_KEY` must be stored securely as an environment variable and should never be hardcoded in the source code or exposed to the client-side. The `.env` file containing the key must be included in `.gitignore`.
2.  **Input Sanitization:** While the service itself doesn't directly deal with user input from the frontend, any data passed into the `messages` array should be sanitized by the calling code (e.g., in the Astro API route) to prevent prompt injection attacks.
3.  **Denial of Service (DoS):** The `maxTokens` parameter should be used and set to a reasonable limit to prevent unexpectedly large (and costly) responses from the API. Access to API routes using this service should be rate-limited to prevent abuse.

## 7. Step-by-Step Implementation Plan

1.  **Create the Service File:**
    -   Create a new file at `src/lib/services/openrouter.service.ts`.

2.  **Install Dependencies:**
    -   Install the necessary library for converting Zod schemas to JSON schemas:
        ```bash
        npm install zod-to-json-schema
        ```

3.  **Define Environment Variables:**
    -   Add `OPENROUTER_API_KEY` and `OPENROUTER_DEFAULT_MODEL` to the `.env.example` file.
    -   Add your actual key to a local `.env` file and ensure `.env` is in `.gitignore`.

4.  **Implement Types and Schemas:**
    -   In the service file, define and export the `ChatMessage`, `ChatOptions`, and `ChatResponse` types.
    -   Define and export example Zod schemas like `FlashcardSchema` and `FlashcardSetSchema` for demonstration and use in other parts of the app.

5.  **Implement the `chat` Method:**
    -   Create the main exported `async function chat(options: ChatOptions): Promise<ChatResponse>`.
    -   Wrap the entire function body in a `try...catch` block. In the `catch` block, log the actual error for debugging and return a standardized `ChatResponse` error object.

6.  **Implement Private Helper Functions (with Clean Code Practices):**
    -   **`_getApiKey`:** Implement this as a guard clause that checks for the API key and throws an error early if it's missing.
    -   **`_buildRequestBody`:** Implement the logic to construct the API request body. Use `zod-to-json-schema` to handle schema conversion.
    -   **`_parseResponse`:** Implement with guard clauses for the API response structure and use `schema.safeParse()` for validation, throwing specific errors on failure.

7.  **Implement the API Call:**
    -   Inside the `chat` method, use the native `fetch` API to make a `POST` request to `https://openrouter.ai/api/v1/chat/completions`.
    -   Set the `Authorization: Bearer ${apiKey}` and `Content-Type: application/json` headers.
    -   Use an early return pattern: check `!response.ok` and, if true, read the error body, throw a custom `ApiError` with the status and message, and stop execution.

8.  **Assemble the `chat` Method Logic:**
    -   The happy path should be at the end of the function.
    -   Call `_getApiKey()` at the beginning.
    -   Call `_buildRequestBody()` to create the request payload.
    -   Make the `fetch` call.
    -   Call `_parseResponse()` with the API response and the original schema.
    -   Return a successful `ChatResponse` object with the parsed data.

9.  **Add Custom Error Classes:**
    -   Define custom error classes extending a base `OpenRouterError` (e.g., `MissingApiKeyError`, `ApiError`, `ResponseParseError`, `ResponseValidationError`) at the bottom of the file to provide specific, meaningful error information.

10. **Write Usage Example (in comments or separate docs):**
    -   Include a clear example of how to use the service in an Astro API route, demonstrating error handling.

    ```typescript
    // Example usage in src/pages/api/sets/generation.ts

    import { chat, FlashcardSetSchema } from 'src/lib/services/openrouter.service.ts';

    // ... inside POST handler
    const topic = 'The Solar System';
    const systemMessage = 'You are an expert flashcard creator. Generate 5 flashcards based on the user topic.';

    const response = await chat({
      systemMessage,
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
      model: 'openai/gpt-4o',
      responseSchema: {
        name: 'flashcard_set',
        schema: FlashcardSetSchema,
      },
      temperature: 0.7,
    });

    if (response.success) {
      const { flashcards } = response.data;
      // ... save flashcards to the database
      return new Response(JSON.stringify(flashcards));
    } else {
      // ... handle error
      return new Response(JSON.stringify(response.error), { status: 500 });
    }
    ```

