import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CardDto } from "@/types";

interface CardViewProps {
  card: CardDto;
}

export function CardView({ card }: CardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="perspective-1000 w-full">
      <Card
        className={`relative transform-style-3d transition-transform duration-700 min-h-[200px] cursor-pointer ${
          isFlipped ? "rotate-x-180" : ""
        }`}
        onClick={handleFlip}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 backface-hidden w-full h-full overflow-y-auto pt-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Front</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl break-words">{card.front}</p>
          </CardContent>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-x-180 overflow-y-auto pt-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Back</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl break-words">{card.back}</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
