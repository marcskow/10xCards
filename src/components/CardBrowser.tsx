import { useCards } from "@/components/hooks/useCards";
import type { CardDto, CreateCardCommand, SetDto } from "@/types";
import { CardView } from "@/components/CardView";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlusCircle, Sparkles } from "lucide-react";
import { GenerateCardsDialog } from "./GenerateCardsDialog";
import { useState } from "react";

interface CardBrowserProps {
  initialSet: SetDto;
  initialCards: CardDto[];
}

export function CardBrowser({ initialSet, initialCards }: CardBrowserProps) {
  const { currentCard, currentIndex, totalCards, goToNextCard, goToPreviousCard, createCard, refetch } = useCards(
    initialSet,
    initialCards
  );
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const handleCardCreated = async (command: CreateCardCommand) => {
    await createCard(command);
    refetch();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">{initialSet.name}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsGenerateOpen(true)}>
            <Sparkles className="h-4 w-4" />
            <span className="sr-only">Generate Cards</span>
          </Button>
          <CreateCardDialog onCreated={handleCardCreated}>
            <Button variant="outline" size="icon">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add new card</span>
            </Button>
          </CreateCardDialog>
        </div>
      </div>

      <GenerateCardsDialog
        setId={initialSet.id}
        isOpen={isGenerateOpen}
        setIsOpen={setIsGenerateOpen}
        onSuccess={refetch}
      />

      {currentCard ? (
        <div className="w-full">
          <CardView card={currentCard} />
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={goToPreviousCard}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {totalCards}
            </p>
            <Button variant="outline" onClick={goToNextCard}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">This set is empty.</h2>
          <p className="text-muted-foreground mt-2 mb-4">Add your first card to get started.</p>
          <div className="flex gap-4">
            <CreateCardDialog onCreated={handleCardCreated}>
              <Button>Add First Card</Button>
            </CreateCardDialog>
            <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
