import type { APIRoute } from "astro";
import { z } from "zod";
import { setService } from "@/lib/services/set.service";

export const prerender = false;

/**
 * GET /api/sets
 * Lists all sets for the authenticated user.
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Parse pagination parameters from query string
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;

  try {
    const result = await setService.listSets(supabase, user.id, page, limit);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

/**
 * POST /api/sets
 * Creates a new set.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase } = locals;
  const user = (locals as any).user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input using Zod
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
    });

    const validatedData = schema.parse(body);
    const newSet = await setService.createSet(supabase, user.id, validatedData);

    return new Response(JSON.stringify(newSet), { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
