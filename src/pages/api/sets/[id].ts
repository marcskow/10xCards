import type { APIRoute } from "astro";
import { z } from "zod";
import { setService } from "@/lib/services/set.service";

export const prerender = false;

/**
 * GET /api/sets/[id]
 * Retrieves a single set by ID.
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase } = locals;
  const user = (locals as any).user;
  const { id } = params;

  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

  try {
    const set = await setService.getSetById(supabase, user.id, id);
    if (!set) {
      return new Response(JSON.stringify({ error: "Set not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(set), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

/**
 * PATCH /api/sets/[id]
 * Updates a set name.
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase } = locals;
  const user = (locals as any).user;
  const { id } = params;

  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

  try {
    const body = await request.json();
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
    });

    const validatedData = schema.parse(body);
    const updatedSet = await setService.updateSet(supabase, user.id, id, validatedData);

    return new Response(JSON.stringify(updatedSet), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

/**
 * DELETE /api/sets/[id]
 * Deletes a set and its cards.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase } = locals;
  const user = (locals as any).user;
  const { id } = params;

  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

  try {
    await setService.deleteSet(supabase, user.id, id);
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
