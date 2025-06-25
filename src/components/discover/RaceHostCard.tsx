
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";

interface RaceHostCardProps {
  host: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
    imageUrl: string;
  };
}

export const RaceHostCard = ({ host }: RaceHostCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tu Host Runner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <img 
            src={host.imageUrl} 
            alt={host.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium">{host.name}</span>
              {host.verified && (
                <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
              )}
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm ml-1 text-gray-500">{host.rating} ⭐</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
