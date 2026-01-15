import { useSets } from "@/components/hooks/useSets";
import type { CreateSetCommand, PaginatedResponse, SetDto } from "@/types";
import { SetCard } from "@/components/SetCard";
import { CreateSetDialog } from "@/components/CreateSetDialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SetsListProps {
  initialData: PaginatedResponse<SetDto>;
}

export function SetsList({ initialData }: SetsListProps) {
  const { sets, page, total, setPage, createSet, deleteSet } = useSets(initialData);
  const totalPages = Math.ceil(total / 20);

  const handleSetCreated = async (newSetData: CreateSetCommand) => {
    await createSet(newSetData);
    // The useSets hook will automatically refresh the list
  };

  const handleSetDeleted = async (setId: string) => {
    if (window.confirm("Are you sure you want to delete this set?")) {
      await deleteSet(setId);
    }
  };

  const handleSetUpdated = (setId: string) => {
    // TODO: Implement rename functionality
    console.log("Rename set:", setId);
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Sets</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CreateSetDialog onCreated={handleSetCreated}>
            <Button>New Set</Button>
          </CreateSetDialog>
        </div>
      </header>
      {sets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sets.map((set) => (
            <SetCard key={set.id} set={set} onUpdate={handleSetUpdated} onDelete={handleSetDeleted} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No sets found</h2>
          <p className="text-muted-foreground mt-2 mb-4">Get started by creating your first set.</p>
          <CreateSetDialog onCreated={handleSetCreated}>
            <Button>Create Your First Set</Button>
          </CreateSetDialog>
        </div>
      )}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.max(1, page - 1));
                }}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(i + 1);
                  }}
                  isActive={page === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.min(totalPages, page + 1));
                }}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
