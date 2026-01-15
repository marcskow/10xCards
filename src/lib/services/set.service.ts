import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types.ts";
import type { SetEntity, SetDto, CreateSetCommand, UpdateSetCommand, PaginatedResponse } from "@/types.ts";

export class SetService {
  /**
   * Maps a database entity (snake_case) to a Data Transfer Object (camelCase).
   */
  private mapToDto(entity: SetEntity): SetDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.created_at,
    };
  }

  /**
   * Retrieves a paginated list of sets for the authenticated user.
   */
  async listSets(
    supabase: SupabaseClient<Database>,
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<SetDto>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch sets with exact count for pagination metadata
    const { data, count, error } = await supabase
      .from("sets")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map(this.mapToDto),
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Creates a new flashcard set.
   * Handles PostgreSQL unique constraint violations for duplicate names.
   */
  async createSet(supabase: SupabaseClient<Database>, userId: string, command: CreateSetCommand): Promise<SetDto> {
    const { data, error } = await supabase
      .from("sets")
      .insert({
        name: command.name,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // 23505 is the Postgres error code for unique_violation
      if (error.code === "23505") {
        throw new Error("A set with this name already exists.");
      }
      throw error;
    }

    return this.mapToDto(data);
  }

  /**
   * Retrieves a single set by its ID, ensuring it belongs to the user.
   */
  async getSetById(supabase: SupabaseClient<Database>, userId: string, setId: string): Promise<SetDto | null> {
    const { data, error } = await supabase.from("sets").select("*").eq("id", setId).eq("user_id", userId).single();

    if (error) {
      // PGRST116 is the PostgREST error for "no rows returned"
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this.mapToDto(data);
  }

  /**
   * Updates the name of an existing set.
   */
  async updateSet(
    supabase: SupabaseClient<Database>,
    userId: string,
    setId: string,
    command: UpdateSetCommand
  ): Promise<SetDto> {
    const { data, error } = await supabase
      .from("sets")
      .update({ name: command.name })
      .eq("id", setId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Another set already uses this name.");
      }
      throw error;
    }

    return this.mapToDto(data);
  }

  /**
   * Deletes a set.
   * Cascading deletes in the DB will automatically remove associated cards.
   */
  async deleteSet(supabase: SupabaseClient<Database>, userId: string, setId: string): Promise<void> {
    const { error } = await supabase.from("sets").delete().eq("id", setId).eq("user_id", userId);

    if (error) throw error;
  }
}

// Export a singleton instance for use in API routes
export const setService = new SetService();
