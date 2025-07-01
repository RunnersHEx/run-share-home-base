
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_image?: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  review_type: 'host_to_guest' | 'guest_to_host';
  categories?: Record<string, number>;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {review.reviewer_image ? (
              <img 
                src={review.reviewer_image} 
                alt={review.reviewer_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold">{review.reviewer_name}</h4>
                <p className="text-sm text-gray-600">{formatDate(review.created_at)}</p>
              </div>
              <Badge variant="outline">
                {review.review_type === 'host_to_guest' ? 'Host' : 'Guest'}
              </Badge>
            </div>
            
            <div className="flex items-center mb-3">
              <div className="flex mr-2">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm font-medium">{review.rating}/5</span>
            </div>
            
            {review.title && (
              <h5 className="font-medium mb-2">{review.title}</h5>
            )}
            
            <p className="text-gray-700 leading-relaxed">{review.content}</p>
            
            {review.categories && Object.keys(review.categories).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Valoraciones específicas:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(review.categories).map(([category, rating]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{category}:</span>
                      <div className="flex">
                        {renderStars(rating)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
