import type { APIRoute } from "astro";
import { cardService } from "@/lib/services/card.service";
import { GenerateCardsDto } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { supabase, user } = locals;
  const { id: setId } = params;

  if (!setId) {
    return new Response("Set ID is required", { status: 400 });
  }

  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }

  const userId = user.id;

  const result = await GenerateCardsDto.safeParseAsync(await request.json());
  if (!result.success) {
    return new Response(JSON.stringify(result.error), { status: 400 });
  }

  const { text } = result.data;

  try {
    const generatedCards = await cardService.generateAndSaveCardsFromText(supabase, userId, setId, text);
    return new Response(JSON.stringify(generatedCards), { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating cards:", error);
    const message = error instanceof Error ? error.message : "An internal server error occurred.";
    return new Response(message, { status: 500 });
  }
};
