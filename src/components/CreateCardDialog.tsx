import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateCardCommand } from "@/types";

interface CreateCardDialogProps {
  onCreated: (command: CreateCardCommand) => Promise<void>;
  children: React.ReactNode;
}

export function CreateCardDialog({ onCreated, children }: CreateCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!front.trim() || !back.trim()) {
      setError("Front and back cannot be empty.");
      return;
    }
    try {
      await onCreated({ front, back });
      setOpen(false);
      setFront("");
      setBack("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
          <DialogDescription>Add a new front and back to your set.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="What is the capital of Poland?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="back">Back</Label>
            <Textarea id="back" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Warsaw" />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Create Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
