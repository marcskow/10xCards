import type { APIRoute } from "astro";
import { RegisterCommand, type AuthSuccessDto, type AuthErrorDto } from "@/types";
import type { ZodError } from "zod";

export const prerender = false;

/**
 * Maps Supabase auth error codes to user-friendly error responses.
 */
function mapSupabaseError(error: { message: string; status?: number }): AuthErrorDto {
  const message = error.message.toLowerCase();

  if (message.includes("user already registered") || message.includes("already exists")) {
    return {
      error: {
        code: "email_in_use",
        message: "An account with this email already exists",
      },
    };
  }

  if (message.includes("rate limit") || error.status === 429) {
    return {
      error: {
        code: "rate_limit",
        message: "Too many registration attempts. Please try again later.",
      },
    };
  }

  if (message.includes("password")) {
    return {
      error: {
        code: "validation_error",
        message: error.message,
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
    const parseResult = RegisterCommand.safeParse(body);
    if (!parseResult.success) {
      const errorResponse = mapValidationError(parseResult.error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = parseResult.data;
    const supabase = locals.supabase;

    // Attempt sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const errorResponse = mapSupabaseError(error);
      const status = errorResponse.error.code === "email_in_use" ? 409 : 500;
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
            message: "Registration failed",
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
      status: 201,
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
