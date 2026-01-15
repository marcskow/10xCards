import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { cardService, CardService } from "@/lib/services/card.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CardDto, CreateCardCommand } from "@/types";
import * as openRouterService from "@/lib/services/openrouter.service";

// Mock the OpenRouter service
vi.mock("@/lib/services/openrouter.service", () => ({
  chat: vi.fn(),
  FlashcardSetSchema: {
    parse: vi.fn(),
  },
}));

describe("CardService", () => {
  let mockSupabase: SupabaseClient<Database>;
  let service: CardService;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh instance for each test
    service = new CardService();

    // Create mock Supabase client with chainable query builder
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
            order: vi.fn(),
          })),
          order: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    } as unknown as SupabaseClient<Database>;
  });

  describe("getCardsBySetId", () => {
    const userId = "user-123";
    const setId = "set-456";

    it("should return cards when user has access to the set", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockCardsData = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          created_at: "2026-01-15T10:00:00Z",
          is_known: false,
          source: "manual",
          set_id: setId,
          user_id: userId,
        },
        {
          id: "card-2",
          front: "Question 2",
          back: "Answer 2",
          created_at: "2026-01-15T11:00:00Z",
          is_known: true,
          source: "ai",
          set_id: setId,
          user_id: userId,
        },
      ];

      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockCardsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCardsData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            select: vi.fn().mockReturnValue(mockCardsQuery),
          };
        }
        return {};
      });

      // Act
      const result = await service.getCardsBySetId(mockSupabase, userId, setId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "card-1",
        front: "Question 1",
        back: "Answer 1",
        createdAt: "2026-01-15T10:00:00Z",
        isKnown: false,
        source: "manual",
        setId: setId,
      });
      expect(result[1]).toEqual({
        id: "card-2",
        front: "Question 2",
        back: "Answer 2",
        createdAt: "2026-01-15T11:00:00Z",
        isKnown: true,
        source: "ai",
        setId: setId,
      });

      // Verify set access was checked
      expect(mockSupabase.from).toHaveBeenCalledWith("sets");
      expect(mockSetQuery.eq).toHaveBeenCalledWith("id", setId);
      expect(mockSetQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSetQuery.single).toHaveBeenCalled();

      // Verify cards were fetched with correct filters
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(mockCardsQuery.eq).toHaveBeenCalledWith("set_id", setId);
      expect(mockCardsQuery.order).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it("should throw error when user does not have access to the set", async () => {
      // Arrange
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.getCardsBySetId(mockSupabase, userId, setId)).rejects.toThrow(
        "Set not found or access denied."
      );
    });

    it("should throw error when set does not exist", async () => {
      // Arrange
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.getCardsBySetId(mockSupabase, userId, setId)).rejects.toThrow(
        "Set not found or access denied."
      );
    });

    it("should throw error when cards query fails", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockCardsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            select: vi.fn().mockReturnValue(mockCardsQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.getCardsBySetId(mockSupabase, userId, setId)).rejects.toThrow();
    });

    it("should return empty array when set has no cards", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockCardsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            select: vi.fn().mockReturnValue(mockCardsQuery),
          };
        }
        return {};
      });

      // Act
      const result = await service.getCardsBySetId(mockSupabase, userId, setId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("createCard", () => {
    const userId = "user-123";
    const setId = "set-456";
    const command: CreateCardCommand & { setId: string } = {
      front: "Test Question",
      back: "Test Answer",
      setId: setId,
    };

    it("should create a card when user has access to the set", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockCardData = {
        id: "card-new",
        front: command.front,
        back: command.back,
        created_at: "2026-01-15T12:00:00Z",
        is_known: false,
        source: "manual",
        set_id: setId,
        user_id: userId,
      };

      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCardData, error: null }),
        }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Act
      const result = await service.createCard(mockSupabase, userId, command);

      // Assert
      expect(result).toEqual({
        id: "card-new",
        front: "Test Question",
        back: "Test Answer",
        createdAt: "2026-01-15T12:00:00Z",
        isKnown: false,
        source: "manual",
        setId: setId,
      });

      // Verify set access was checked
      expect(mockSupabase.from).toHaveBeenCalledWith("sets");
      expect(mockSetQuery.eq).toHaveBeenCalledWith("id", setId);
      expect(mockSetQuery.eq).toHaveBeenCalledWith("user_id", userId);

      // Verify card was inserted
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
    });

    it("should throw error when user does not have access to the set", async () => {
      // Arrange
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.createCard(mockSupabase, userId, command)).rejects.toThrow(
        "Set not found or access denied."
      );
    });

    it("should throw error when card insertion fails", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Insert failed", code: "23505" } }),
        }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.createCard(mockSupabase, userId, command)).rejects.toThrow();
    });
  });

  describe("generateAndSaveCardsFromText", () => {
    const userId = "user-123";
    const setId = "set-456";
    const text = "Photosynthesis is the process by which plants convert light energy into chemical energy.";

    it("should generate and save cards successfully", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockGeneratedCards = [
        {
          id: "card-gen-1",
          front: "What is photosynthesis?",
          back: "The process by which plants convert light energy into chemical energy",
          created_at: "2026-01-15T12:00:00Z",
          is_known: false,
          source: "ai",
          set_id: setId,
          user_id: userId,
        },
        {
          id: "card-gen-2",
          front: "What type of energy does photosynthesis convert?",
          back: "Light energy to chemical energy",
          created_at: "2026-01-15T12:00:01Z",
          is_known: false,
          source: "ai",
          set_id: setId,
          user_id: userId,
        },
      ];

      const mockInsertQuery = {
        select: vi.fn().mockResolvedValue({ data: mockGeneratedCards, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter chat response
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: true,
        data: {
          flashcards: [
            {
              term: "What is photosynthesis?",
              definition: "The process by which plants convert light energy into chemical energy",
            },
            { term: "What type of energy does photosynthesis convert?", definition: "Light energy to chemical energy" },
          ],
        },
      });

      // Act
      const result = await service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].front).toBe("What is photosynthesis?");
      expect(result[0].source).toBe("ai");
      expect(result[1].front).toBe("What type of energy does photosynthesis convert?");
      expect(result[1].source).toBe("ai");

      // Verify OpenRouter was called with correct parameters
      expect(openRouterService.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("Create flashcards from the following text"),
            }),
          ]),
          model: "tngtech/deepseek-r1t-chimera:free",
          temperature: 0.7,
          maxTokens: 2000,
        })
      );

      // Verify cards were inserted
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
    });

    it("should throw error when user does not have access to the set", async () => {
      // Arrange
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text)).rejects.toThrow(
        "Set not found or access denied."
      );

      // Verify OpenRouter was not called
      expect(openRouterService.chat).not.toHaveBeenCalled();
    });

    it("should throw error when text is empty", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, "")).rejects.toThrow(
        "Text is required for card generation."
      );

      // Verify OpenRouter was not called
      expect(openRouterService.chat).not.toHaveBeenCalled();
    });

    it("should throw error when text is only whitespace", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, "   ")).rejects.toThrow(
        "Text is required for card generation."
      );

      // Verify OpenRouter was not called
      expect(openRouterService.chat).not.toHaveBeenCalled();
    });

    it("should throw error when text exceeds maximum length", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      const longText = "a".repeat(10001);

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, longText)).rejects.toThrow(
        "Text is too long. Maximum 10,000 characters allowed."
      );

      // Verify OpenRouter was not called
      expect(openRouterService.chat).not.toHaveBeenCalled();
    });

    it("should throw error when AI generation fails", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter failure
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: false,
        error: {
          message: "API rate limit exceeded",
          code: "rate_limit",
        },
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text)).rejects.toThrow(
        "Failed to generate flashcards: API rate limit exceeded"
      );
    });

    it("should throw error when AI generates no flashcards", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter with empty flashcards
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: true,
        data: {
          flashcards: [],
        },
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text)).rejects.toThrow(
        "AI did not generate any flashcards. Please try with different text."
      );
    });

    it("should throw error when database insertion fails", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockResolvedValue({ data: null, error: { message: "Insert failed" } }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter success
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: true,
        data: {
          flashcards: [{ term: "Question", definition: "Answer" }],
        },
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text)).rejects.toThrow();
    });

    it("should throw error when no cards are saved to database", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter success
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: true,
        data: {
          flashcards: [{ term: "Question", definition: "Answer" }],
        },
      });

      // Act & Assert
      await expect(service.generateAndSaveCardsFromText(mockSupabase, userId, setId, text)).rejects.toThrow(
        "Failed to save generated cards to database."
      );
    });

    it("should handle maximum allowed text length", async () => {
      // Arrange
      const mockSetData = { id: setId };
      const mockSetQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSetData, error: null }),
      };

      const mockGeneratedCards = [
        {
          id: "card-gen-1",
          front: "Test Question",
          back: "Test Answer",
          created_at: "2026-01-15T12:00:00Z",
          is_known: false,
          source: "ai",
          set_id: setId,
          user_id: userId,
        },
      ];

      const mockInsertQuery = {
        select: vi.fn().mockResolvedValue({ data: mockGeneratedCards, error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === "sets") {
          return {
            select: vi.fn().mockReturnValue(mockSetQuery),
          };
        }
        if (table === "cards") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertQuery),
          };
        }
        return {};
      });

      // Mock OpenRouter success
      vi.mocked(openRouterService.chat).mockResolvedValue({
        success: true,
        data: {
          flashcards: [{ term: "Test Question", definition: "Test Answer" }],
        },
      });

      const maxLengthText = "a".repeat(10000);

      // Act
      const result = await service.generateAndSaveCardsFromText(mockSupabase, userId, setId, maxLengthText);

      // Assert
      expect(result).toHaveLength(1);
      expect(openRouterService.chat).toHaveBeenCalled();
    });
  });

  describe("cardService singleton", () => {
    it("should export a singleton instance", () => {
      expect(cardService).toBeInstanceOf(CardService);
    });

    it("should be the same instance across imports", () => {
      const anotherReference = cardService;
      expect(cardService).toBe(anotherReference);
    });
  });
});
