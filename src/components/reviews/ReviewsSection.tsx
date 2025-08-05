import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { Star, MessageSquare, Award } from "lucide-react";
import { toast } from "sonner";

interface ReviewData {
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

const ReviewsSection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    hostReviews: 0,
    guestReviews: 0
  });

  const fetchReviews = async () => {
    if (!user) return;

    try {
      // Fetch received reviews
      const { data: receivedReviews, error: reviewsError } = await supabase
        .from('booking_reviews')
        .select(`
          *,
          reviewer:profiles!booking_reviews_reviewer_id_fkey(first_name, last_name, profile_image_url)
        `)
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Transform data to match expected format with proper typing
      const transformedReviews: ReviewData[] = (receivedReviews || []).map(review => ({
        id: review.id,
        reviewer_name: `${review.reviewer.first_name} ${review.reviewer.last_name}`,
        reviewer_image: review.reviewer.profile_image_url,
        rating: review.rating,
        title: review.title,
        content: review.content,
        created_at: review.created_at,
        review_type: review.review_type as 'host_to_guest' | 'guest_to_host',
        categories: review.categories as Record<string, number> | undefined
      }));

      // Calculate stats
      const totalReviews = transformedReviews.length;
      const averageRating = totalReviews > 0 
        ? transformedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      const hostReviews = transformedReviews.filter(r => r.review_type === 'guest_to_host').length;
      const guestReviews = transformedReviews.filter(r => r.review_type === 'host_to_guest').length;

      setReviews(transformedReviews);
      setStats({ totalReviews, averageRating, hostReviews, guestReviews });

      // Fetch completed bookings without reviews
      const { data: completedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          host:profiles!bookings_host_id_profiles_fkey(id, first_name, last_name, profile_image_url),
          guest:profiles!bookings_guest_id_profiles_fkey(id, first_name, last_name, profile_image_url),
          race:races(name, race_date)
        `)
        .eq('status', 'completed')
        .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`);

      if (bookingsError) throw bookingsError;

      // Filter bookings that don't have reviews yet
      const bookingsWithoutReviews = [];
      for (const booking of completedBookings || []) {
        const { data: existingReview } = await supabase
          .from('booking_reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('reviewer_id', user.id)
          .single();

        if (!existingReview) {
          bookingsWithoutReviews.push(booking);
        }
      }

      setPendingReviews(bookingsWithoutReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error al cargar las valoraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (reviewData: any) => {
    try {
      const { error } = await supabase
        .from('booking_reviews')
        .insert({
          ...reviewData,
          reviewer_id: user?.id
        });

      if (error) throw error;

      toast.success('Valoración enviada correctamente');
      setShowReviewForm(null);
      fetchReviews(); // Refresh data
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error al enviar la valoración');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showReviewForm) {
    const isHost = showReviewForm.host_id === user?.id;
    const otherUser = isHost ? showReviewForm.guest : showReviewForm.host;
    
    return (
      <ReviewForm
        bookingId={showReviewForm.id}
        revieweeId={otherUser.id}
        revieweeName={`${otherUser.first_name} ${otherUser.last_name}`}
        reviewType={isHost ? 'host_to_guest' : 'guest_to_host'}
        onSubmit={handleSubmitReview}
        onCancel={() => setShowReviewForm(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Mis Valoraciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.hostReviews}</div>
              <div className="text-sm text-gray-600">Como Host</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.guestReviews}</div>
              <div className="text-sm text-gray-600">Como Guest</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="received">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Valoraciones Recibidas</TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes {pendingReviews.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingReviews.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Sin valoraciones aún</h3>
                <p className="text-gray-600">
                  Las valoraciones de tus experiencias aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingReviews.length > 0 ? (
            <div className="space-y-4">
              {pendingReviews.map((booking) => {
                const isHost = booking.host_id === user?.id;
                const otherUser = isHost ? booking.guest : booking.host;
                
                return (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="font-semibold">
                              {otherUser.first_name?.charAt(0)}{otherUser.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {otherUser.first_name} {otherUser.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {booking.race.name} - {new Date(booking.race.race_date).toLocaleDateString('es-ES')}
                            </p>
                            <Badge variant="outline">
                              {isHost ? 'Valorar como Host' : 'Valorar como Guest'}
                            </Badge>
                          </div>
                        </div>
                        <Button onClick={() => setShowReviewForm(booking)}>
                          Valorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Sin valoraciones pendientes</h3>
                <p className="text-gray-600">
                  Todas tus experiencias están valoradas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewsSection;
