import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateCards } from "./hooks/useGenerateCards";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface GenerateCardsDialogProps {
  setId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function GenerateCardsDialog({ setId, isOpen, setIsOpen, onSuccess }: GenerateCardsDialogProps) {
  const [text, setText] = useState("");
  const { generate, isLoading, error } = useGenerateCards({ setId, onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Cards from Text</DialogTitle>
          <DialogDescription>
            Paste your text below. The AI will analyze it and create flashcards for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <Label htmlFor="text-input">Text to analyze</Label>
            <Textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes, an article, or any text here..."
              className="min-h-[200px] resize-none"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
