import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CardDto, CreateCardCommand } from "@/types";
import { chat, FlashcardSetSchema } from "./openrouter.service";
import { z } from "zod";

type CardEntity = Database["public"]["Tables"]["cards"]["Row"];

export class CardService {
  private mapToDto(entity: CardEntity): CardDto {
    return {
      id: entity.id,
      front: entity.front,
      back: entity.back,
      createdAt: entity.created_at,
      isKnown: entity.is_known,
      source: entity.source,
      setId: entity.set_id,
    };
  }

  async getCardsBySetId(supabase: SupabaseClient<Database>, userId: string, setId: string): Promise<CardDto[]> {
    // First, verify the user has access to the set.
    const { data: setData, error: setError } = await supabase
      .from("sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError || !setData) {
      // This will be caught by the caller.
      // In a real app, you might want more specific error types.
      throw new Error("Set not found or access denied.");
    }

    // If access is confirmed, fetch the cards for that set.
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("set_id", setId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapToDto);
  }

  async createCard(
    supabase: SupabaseClient<Database>,
    userId: string,
    command: CreateCardCommand & { setId: string }
  ): Promise<CardDto> {
    // Verify the user has access to the set before creating a card in it.
    const { data: setData, error: setError } = await supabase
      .from("sets")
      .select("id")
      .eq("id", command.setId)
      .eq("user_id", userId)
      .single();

    if (setError || !setData) {
      throw new Error("Set not found or access denied.");
    }

    const { data, error } = await supabase
      .from("cards")
      .insert({
        front: command.front,
        back: command.back,
        set_id: command.setId,
        user_id: userId, // Assuming cards are also directly associated with a user
        source: "manual", // Or another source if specified
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapToDto(data);
  }

  async generateAndSaveCardsFromText(
    supabase: SupabaseClient<Database>,
    userId: string,
    setId: string,
    text: string
  ): Promise<CardDto[]> {
    // 1. Verify user has access to the set
    const { data: setData, error: setError } = await supabase
      .from("sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError || !setData) {
      throw new Error("Set not found or access denied.");
    }

    // Guard: Validate input text
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for card generation.");
    }

    if (text.length > 10000) {
      throw new Error("Text is too long. Maximum 10,000 characters allowed.");
    }

    // 2. Generate cards using OpenRouter AI service
    const systemMessage = `You are an expert at creating educational flashcards. 
Your task is to analyze the provided text and create high-quality flashcards that help students learn the key concepts.

Guidelines:
- Create clear, concise flashcards
- Each term should be a key concept, term, or question
- Each definition should be accurate and easy to understand
- Generate 3-10 flashcards depending on the content length and complexity
- Focus on the most important information
- Use simple language that's appropriate for the subject matter`;

    const response = await chat({
      systemMessage,
      messages: [
        {
          role: "user",
          content: `Create flashcards from the following text:\n\n${text}`,
        },
      ],
      model: "tngtech/deepseek-r1t-chimera:free",
      responseSchema: {
        name: "flashcard_set",
        schema: FlashcardSetSchema,
      },
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Guard: Check if AI generation was successful
    if (!response.success) {
      throw new Error(`Failed to generate flashcards: ${response.error.message}`);
    }

    // Type assertion for the validated response
    const aiResult = response.data as z.infer<typeof FlashcardSetSchema>;

    // Guard: Ensure we have flashcards
    if (!aiResult.flashcards || aiResult.flashcards.length === 0) {
      throw new Error("AI did not generate any flashcards. Please try with different text.");
    }

    // 3. Map AI-generated flashcards to database format
    const cardsToInsert = aiResult.flashcards.map((card) => ({
      front: card.term,
      back: card.definition,
      set_id: setId,
      user_id: userId,
      source: "ai" as const,
    }));

    // 4. Insert generated cards into the database
    const { data, error } = await supabase.from("cards").insert(cardsToInsert).select();

    if (error) {
      throw error;
    }

    // Guard: Ensure cards were inserted
    if (!data || data.length === 0) {
      throw new Error("Failed to save generated cards to database.");
    }

    return data.map(this.mapToDto);
  }
}

export const cardService = new CardService();
