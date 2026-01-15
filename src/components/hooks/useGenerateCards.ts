import { useState } from "react";
import { GenerateCardsDto } from "@/types";

interface UseGenerateCardsProps {
  setId: string;
  onSuccess: () => void;
}

export function useGenerateCards({ setId, onSuccess }: UseGenerateCardsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (text: string) => {
    setIsLoading(true);
    setError(null);

    const validation = GenerateCardsDto.safeParse({ text });
    if (!validation.success) {
      const errorMessage = validation.error.flatten().fieldErrors.text?.join(", ") ?? "Invalid input.";
      setError(errorMessage);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/sets/${setId}/generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate cards.");
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    generate,
  };
}
