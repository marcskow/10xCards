import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server";

/**
 * Public routes that don't require authentication.
 * All other routes will redirect to /login if not authenticated.
 */
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

/**
 * Checks if a given path is a public route.
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(route + "/"));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;

  // Create Supabase server client with cookie access
  const supabase = createSupabaseServerClient(cookies);
  context.locals.supabase = supabase;

  // Get current user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Set user in context if authenticated
  if (user && !error) {
    context.locals.user = user;
  } else {
    context.locals.user = null;
  }

  const isPublic = isPublicRoute(url.pathname);

  // Redirect unauthenticated users to login for protected routes
  if (!context.locals.user && !isPublic) {
    return redirect("/login");
  }

  // Redirect authenticated users away from auth pages
  if (context.locals.user && (url.pathname === "/login" || url.pathname === "/register")) {
    return redirect("/");
  }

  return next();
});
