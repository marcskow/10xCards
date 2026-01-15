# Services Documentation

This directory contains service modules that encapsulate business logic and external integrations.

## OpenRouter Service

The `openrouter.service.ts` provides an interface for interacting with the OpenRouter AI API.

### Features

- **Type-safe chat completions**: Full TypeScript support with proper types
- **Structured JSON responses**: Uses Zod schemas for validation
- **Comprehensive error handling**: Custom error classes for different scenarios
- **Multiple AI models**: Support for various LLM providers through OpenRouter

### Configuration

Required environment variables:

```env
OPENROUTER_API_KEY=sk-or-v1-...  # Required: Your OpenRouter API key
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini  # Optional: Default model (defaults to gpt-3.5-turbo)
```

### Usage Example

```typescript
import { chat, FlashcardSetSchema } from '@/lib/services/openrouter.service';

// Generate flashcards from text
const response = await chat({
  systemMessage: 'You are an expert flashcard creator.',
  messages: [
    { 
      role: 'user', 
      content: 'Create flashcards about the water cycle' 
    }
  ],
  model: 'openai/gpt-4o-mini',
  responseSchema: {
    name: 'flashcard_set',
    schema: FlashcardSetSchema,
  },
  temperature: 0.7,
  maxTokens: 2000,
});

if (response.success) {
  // Response data is fully typed and validated
  const { flashcards } = response.data;
  flashcards.forEach(card => {
    console.log(`Term: ${card.term}`);
    console.log(`Definition: ${card.definition}`);
  });
} else {
  // Handle error
  console.error(`Error: ${response.error.message}`);
  console.error(`Code: ${response.error.code}`);
}
```

### Available Models

Popular models you can use:

- `openai/gpt-4o` - Latest GPT-4 Omni model
- `openai/gpt-4o-mini` - Smaller, faster GPT-4 variant (recommended for flashcards)
- `openai/gpt-3.5-turbo` - Fast and cost-effective
- `google/gemini-pro` - Google's Gemini model
- `anthropic/claude-3-opus` - Anthropic's most capable model
- `anthropic/claude-3-sonnet` - Balanced performance and cost

See [OpenRouter documentation](https://openrouter.ai/docs) for the full list.

### Error Handling

The service handles various error scenarios:

1. **MissingApiKeyError**: API key not configured
2. **ApiError**: API request failures (auth, rate limits, etc.)
3. **ResponseParseError**: Invalid JSON in response
4. **ResponseValidationError**: Response doesn't match schema

All errors are returned in a standardized format:

```typescript
{
  success: false,
  error: {
    message: "Description of the error",
    code: "ERROR_CODE"
  }
}
```

### Custom Schemas

You can create custom Zod schemas for different use cases:

```typescript
import { z } from 'zod';

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
});

const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

// Use in chat request
const response = await chat({
  messages: [{ role: 'user', content: 'Create a quiz about biology' }],
  responseSchema: {
    name: 'quiz',
    schema: QuizSchema,
  },
});
```

## Card Service

The `card.service.ts` handles all card-related operations including AI-powered card generation.

### Key Methods

- `getCardsBySetId()`: Retrieve cards for a specific set
- `createCard()`: Manually create a single card
- `generateAndSaveCardsFromText()`: Generate cards from text using AI

### AI Card Generation

The card service integrates with the OpenRouter service to generate flashcards:

```typescript
import { cardService } from '@/lib/services/card.service';

const cards = await cardService.generateAndSaveCardsFromText(
  supabase,
  userId,
  setId,
  'Your text content here...'
);
```

The service:
1. Validates user access to the set
2. Calls OpenRouter AI with optimized prompts
3. Validates the AI response
4. Saves cards to the database
5. Returns the created cards

## Set Service

The `set.service.ts` handles flashcard set management.

### Key Methods

- `listSets()`: Get paginated list of user's sets
- `createSet()`: Create a new flashcard set
- `getSetById()`: Retrieve a specific set
- `updateSet()`: Update set details
- `deleteSet()`: Remove a set and its cards

## Best Practices

### Service Usage in API Routes

```typescript
import type { APIRoute } from 'astro';
import { cardService } from '@/lib/services/card.service';

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { text } = await request.json();
    const cards = await cardService.generateAndSaveCardsFromText(
      supabase,
      user.id,
      setId,
      text
    );
    
    return new Response(JSON.stringify(cards), { status: 201 });
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : 'An error occurred';
    return new Response(message, { status: 500 });
  }
};
```

### Error Handling

Always handle service errors appropriately:

1. Use try-catch blocks in API routes
2. Return appropriate HTTP status codes
3. Log errors for debugging (server-side only)
4. Return user-friendly error messages

### Security Considerations

1. **API Keys**: Never expose API keys to the client
2. **Authentication**: Always verify user authentication in API routes
3. **Authorization**: Check user owns the resources they're accessing
4. **Input Validation**: Use Zod schemas to validate all inputs
5. **Rate Limiting**: Consider implementing rate limits for AI operations
6. **Cost Control**: Set `maxTokens` to prevent unexpectedly large API costs

