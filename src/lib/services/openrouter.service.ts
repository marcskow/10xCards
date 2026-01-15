/**
 * OpenRouter Service
 *
 * Provides a streamlined interface for interacting with the OpenRouter AI API.
 * This service handles chat completions with support for structured JSON responses
 * using Zod schemas for validation.
 *
 * Features:
 * - Type-safe chat completions
 * - Structured JSON responses with Zod validation
 * - Comprehensive error handling
 * - Support for multiple AI models
 *
 * @example
 * ```typescript
 * import { chat, FlashcardSetSchema } from '@/lib/services/openrouter.service';
 *
 * const response = await chat({
 *   systemMessage: 'You are an expert flashcard creator.',
 *   messages: [{ role: 'user', content: 'Create flashcards about photosynthesis' }],
 *   model: 'openai/gpt-4o-mini',
 *   responseSchema: {
 *     name: 'flashcard_set',
 *     schema: FlashcardSetSchema,
 *   },
 *   temperature: 0.7,
 * });
 *
 * if (response.success) {
 *   console.log(response.data.flashcards);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ============================================================================
// Types and Schemas
// ============================================================================

/**
 * Zod schema for a single flashcard.
 */
export const FlashcardSchema = z.object({
  term: z.string().describe("The term or concept to be learned"),
  definition: z.string().describe("A clear and concise definition of the term"),
});

/**
 * Zod schema for a set of flashcards.
 */
export const FlashcardSetSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe("An array of generated flashcards"),
});

/**
 * Interface for chat messages.
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Options for the chat completion request.
 */
export interface ChatOptions {
  messages: ChatMessage[];
  systemMessage?: string;
  model?: string; // e.g., 'openai/gpt-4o', 'google/gemini-pro'
  responseSchema?: {
    name: string;
    schema: z.ZodObject<z.ZodRawShape>;
  };
  temperature?: number; // 0.0 - 2.0
  maxTokens?: number;
}

/**
 * Response type for chat completion.
 */
export type ChatResponse<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
        code?: string;
      };
    };

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base error class for OpenRouter service errors.
 */
class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Error thrown when the API key is missing.
 */
class MissingApiKeyError extends OpenRouterError {
  constructor() {
    super("OPENROUTER_API_KEY environment variable is not set");
    this.name = "MissingApiKeyError";
  }
}

/**
 * Error thrown when the API returns an error response.
 */
class ApiError extends OpenRouterError {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Error thrown when response parsing fails.
 */
class ResponseParseError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "ResponseParseError";
  }
}

/**
 * Error thrown when response validation fails.
 */
class ResponseValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "ResponseValidationError";
  }
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Retrieves the OpenRouter API key from environment variables.
 * @throws {MissingApiKeyError} if the API key is not set
 */
function _getApiKey(): string {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  return apiKey;
}

/**
 * Builds the request body for the OpenRouter API.
 */
function _buildRequestBody(options: ChatOptions): object {
  const { messages, systemMessage, model, responseSchema, temperature, maxTokens } = options;

  // Prepend system message if provided
  const allMessages: ChatMessage[] = systemMessage
    ? [{ role: "system" as const, content: systemMessage }, ...messages]
    : messages;

  // Use default model if not specified
  const selectedModel = model || import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-3.5-turbo";

  // Build base request body
  const requestBody: Record<string, unknown> = {
    model: selectedModel,
    messages: allMessages,
  };

  // Add optional parameters
  if (temperature !== undefined) {
    requestBody.temperature = temperature;
  }

  if (maxTokens !== undefined) {
    requestBody.max_tokens = maxTokens;
  }

  // Handle structured response format if schema provided
  if (responseSchema) {
    const jsonSchema = zodToJsonSchema(responseSchema.schema, responseSchema.name);
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: responseSchema.name,
        schema: jsonSchema,
        strict: true,
      },
    };
  }

  return requestBody;
}

/**
 * Parses and validates the API response.
 */
function _parseResponse(apiResponse: unknown, responseSchema?: z.ZodObject<z.ZodRawShape>): unknown {
  // Type guard for API response structure
  const isValidApiResponse = (response: unknown): response is { choices: { message: { content: string } }[] } => {
    if (typeof response !== "object" || response === null || !("choices" in response)) {
      return false;
    }
    const choices = (response as Record<string, unknown>).choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      return false;
    }
    const firstChoice = choices[0] as Record<string, unknown>;
    const message = firstChoice.message as Record<string, unknown> | undefined;
    return typeof message?.content === "string";
  };

  // Guard: Check if response has expected structure
  if (!isValidApiResponse(apiResponse)) {
    throw new ResponseParseError("API response is missing expected structure");
  }

  const content = apiResponse.choices[0].message.content;

  // If no schema provided, return raw text content
  if (!responseSchema) {
    return content;
  }

  // Parse JSON content
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch (error) {
    throw new ResponseParseError(`Failed to parse JSON response: ${(error as Error).message}`);
  }

  // Validate against schema
  const validationResult = responseSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new ResponseValidationError(`Response validation failed: ${errors}`);
  }

  return validationResult.data;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Sends a chat completion request to the OpenRouter API.
 *
 * @example
 * ```typescript
 * const response = await chat({
 *   systemMessage: 'You are an expert flashcard creator.',
 *   messages: [{ role: 'user', content: 'Topic: The Solar System' }],
 *   model: 'openai/gpt-4o',
 *   responseSchema: {
 *     name: 'flashcard_set',
 *     schema: FlashcardSetSchema,
 *   },
 *   temperature: 0.7,
 * });
 *
 * if (response.success) {
 *   console.log(response.data.flashcards);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  try {
    // Guard: Get API key (throws if missing)
    const apiKey = _getApiKey();

    // Build request body
    const requestBody = _buildRequestBody(options);

    // Make API request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Guard: Check if response is ok
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      let errorCode = `HTTP_${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorMessage;
        errorCode = errorJson.error?.code || errorCode;
      } catch {
        // If error body is not JSON, use the raw text
        if (errorBody) {
          errorMessage = `${errorMessage}: ${errorBody}`;
        }
      }

      throw new ApiError(errorMessage, errorCode, response.status);
    }

    // Parse response
    const apiResponse = await response.json();

    // Parse and validate response content
    const data = _parseResponse(apiResponse, options.responseSchema?.schema);

    // Happy path: return success response
    return {
      success: true,
      data,
    };
  } catch (error) {
    // Return standardized error response
    if (error instanceof OpenRouterError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      },
    };
  }
}
