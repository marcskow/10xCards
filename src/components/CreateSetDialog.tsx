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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateSetCommand, SetDto } from "@/types";

interface CreateSetDialogProps {
  onCreated: (command: CreateSetCommand) => Promise<SetDto | void>;
  children: React.ReactNode;
}

export function CreateSetDialog({ onCreated, children }: CreateSetDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Set name cannot be empty.");
      return;
    }
    try {
      // The onCreated prop is expected to be a function that calls the createSet method from the useSets hook.
      // This hook will handle the API call and subsequent state updates.
      await onCreated({ name });
      setOpen(false);
      setName("");
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
          <DialogDescription>Give your new set a name. You can change it later.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          {error && <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Create Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
