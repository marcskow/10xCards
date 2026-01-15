import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { PaginatedResponse, SetDto, CreateSetCommand } from "@/types";

const API_BASE_URL = "/api/sets";

export function useSets(initialData: PaginatedResponse<SetDto>) {
  const [sets, setSets] = useState<SetDto[]>(initialData.data);
  const [page, setPage] = useState(initialData.pagination.page);
  const [total, setTotal] = useState(initialData.pagination.total);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSets = useCallback(async (newPage: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?page=${newPage}&limit=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch sets");
      }
      const data: PaginatedResponse<SetDto> = await response.json();
      setSets(data.data);
      setPage(data.pagination.page);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error(error);
      // Here you might want to set an error state to show in the UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on initial mount if there's no initial data from the server.
    if (initialData.data.length === 0) {
      fetchSets(page);
    }
  }, [fetchSets]);

  useEffect(() => {
    // Fetch when page changes, but avoid re-fetching the initial page on mount
    // if data was already provided by the server.
    if (page !== initialData.pagination.page && initialData.data.length > 0) {
      fetchSets(page);
    }
  }, [page, fetchSets, initialData]);

  const createSet = useCallback(
    async (command: CreateSetCommand) => {
      setIsLoading(true);
      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });
        if (!response.ok) {
          throw new Error("Failed to create set");
        }
        const newSet: SetDto = await response.json();
        // Refetch the current page to get the latest data
        await fetchSets(page);
        toast.success("Set created successfully!");
        return newSet;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create set.";
        toast.error(errorMessage);
        throw error; // Re-throw to be caught in the component
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSets, page]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/${setId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete set");
        }
        // Refetch sets to update the list
        await fetchSets(page);
        toast.success("Set deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete set.");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSets, page]
  );

  return {
    sets,
    page,
    total,
    isLoading,
    setPage,
    createSet,
    deleteSet,
  };
}
