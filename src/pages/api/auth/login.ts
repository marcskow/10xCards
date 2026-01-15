import type { APIRoute } from "astro";
import { LoginCommand, type AuthSuccessDto, type AuthErrorDto } from "@/types";
import type { ZodError } from "zod";

export const prerender = false;

/**
 * Maps Supabase auth error codes to user-friendly error responses.
 */
function mapSupabaseError(error: { message: string; status?: number }): AuthErrorDto {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return {
      error: {
        code: "invalid_credentials",
        message: "Invalid email or password",
      },
    };
  }

  if (message.includes("rate limit") || error.status === 429) {
    return {
      error: {
        code: "rate_limit",
        message: "Too many login attempts. Please try again later.",
      },
    };
  }

  return {
    error: {
      code: "server_error",
      message: "An unexpected error occurred. Please try again.",
    },
  };
}

/**
 * Maps Zod validation errors to our error format.
 */
function mapValidationError(error: ZodError): AuthErrorDto {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return {
    error: {
      code: "validation_error",
      message: "Please check your input and try again.",
      details,
    },
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = LoginCommand.safeParse(body);
    if (!parseResult.success) {
      const errorResponse = mapValidationError(parseResult.error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = parseResult.data;
    const supabase = locals.supabase;

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorResponse = mapSupabaseError(error);
      const status = errorResponse.error.code === "invalid_credentials" ? 401 : 500;
      return new Response(JSON.stringify(errorResponse), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "server_error",
            message: "Authentication failed",
          },
        } satisfies AuthErrorDto),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response: AuthSuccessDto = {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
