import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function for React tests
 * You can add providers here (e.g., for zustand store, theme provider, etc.)
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options });
}

/**
 * Helper for waiting on async operations in tests
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Helper for generating random IDs in tests
 */
export const generateTestId = (prefix = "test") => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Re-export all utilities from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
