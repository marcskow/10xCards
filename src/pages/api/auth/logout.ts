import type { APIRoute } from "astro";
import type { AuthErrorDto } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    const supabase = locals.supabase;

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: "server_error",
            message: "Failed to sign out",
          },
        } satisfies AuthErrorDto),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Redirect to login page after successful logout
    return redirect("/login");
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "server_error",
          message: "An unexpected error occurred",
        },
      } satisfies AuthErrorDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
