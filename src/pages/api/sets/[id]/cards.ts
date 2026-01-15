import type { APIRoute, APIContext } from "astro";
import { z } from "zod";
import { cardService } from "@/lib/services/card.service";
import type { CreateCardCommand } from "@/types";

const createCardSchema = z.object({
  front: z.string().min(1, "Front cannot be empty."),
  back: z.string().min(1, "Back cannot be empty."),
});

export const prerender = false;

export async function GET(context: APIContext) {
  const { locals, params } = context;
  const { user } = locals;
  const setId = params.id;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!setId) {
    return new Response("Set ID is required", { status: 400 });
  }

  try {
    const cards = await cardService.getCardsBySetId(context.locals.supabase, user.id, setId);
    return new Response(JSON.stringify(cards), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { id: setId } = params;
  const { supabase, user } = locals;

  if (!setId) {
    return new Response("Set ID is required.", { status: 400 });
  }

  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createCardSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), {
        status: 400,
      });
    }

    const command: CreateCardCommand = validation.data;
    const newCard = await cardService.createCard(supabase, user.id, {
      ...command,
      setId,
    });

    return new Response(JSON.stringify(newCard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating card:", error);
    const message = error instanceof Error ? error.message : "An internal server error occurred.";
    return new Response(message, { status: 500 });
  }
};
