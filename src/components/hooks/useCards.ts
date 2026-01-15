import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { CardDto, CreateCardCommand, SetDto } from "@/types";

const API_BASE_URL = "/api/sets";

export function useCards(initialSet: SetDto, initialCards: CardDto[]) {
  const [cards, setCards] = useState<CardDto[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentCard = useMemo(() => {
    return cards.length > 0 ? cards[currentIndex] : null;
  }, [cards, currentIndex]);

  const totalCards = useMemo(() => cards.length, [cards]);

  const goToNextCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const goToPreviousCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  const refetch = async () => {
    const response = await fetch(`/api/sets/${initialSet.id}/cards`);
    if (response.ok) {
      const newCards = await response.json();
      setCards(newCards);
      // Reset index if needed, e.g., go to the first card
      setCurrentIndex(0);
    }
  };

  const createCard = useCallback(
    async (command: CreateCardCommand) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/${initialSet.id}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create card.");
        }

        const newCard: CardDto = await response.json();
        setCards((prevCards) => [...prevCards, newCard]);
        toast.success("Card created successfully!");
        return newCard;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [initialSet.id]
  );

  return {
    cards,
    currentCard,
    currentIndex,
    totalCards,
    isLoading,
    goToNextCard,
    goToPreviousCard,
    createCard,
    refetch,
  };
}
