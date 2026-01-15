import type { SetDto } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SetActions } from "@/components/SetActions";

interface SetCardProps {
  set: SetDto;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SetCard({ set, onUpdate, onDelete }: SetCardProps) {
  const formattedDate = new Date(set.createdAt).toLocaleDateString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <a href={`/sets/${set.id}`}>{set.name}</a>
        </CardTitle>
        <SetActions onRename={() => onUpdate(set.id)} onDelete={() => onDelete(set.id)} />
      </CardHeader>
      <CardContent>
        <CardDescription>Created on {formattedDate}</CardDescription>
      </CardContent>
    </Card>
  );
}
