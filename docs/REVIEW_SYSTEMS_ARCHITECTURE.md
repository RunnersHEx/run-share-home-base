# Review Systems Architecture

This application implements **two distinct review systems** according to the database schema:

## 🏃‍♂️ **1. Booking Reviews System (`booking_reviews` table)**

### **Purpose:** 
Reviews for race booking experiences between hosts and guests.

### **Database Structure:**
```sql
CREATE TABLE public.booking_reviews (
  id uuid PRIMARY KEY,
  booking_id uuid UNIQUE NOT NULL,          -- Links to bookings table
  reviewer_id uuid NOT NULL,               -- Who wrote the review
  reviewee_id uuid NOT NULL,               -- Who is being reviewed
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,                              -- Optional review title
  content text NOT NULL,                   -- Required detailed review
  review_type text CHECK (review_type = ANY (ARRAY['host_to_guest', 'guest_to_host'])),
  categories jsonb DEFAULT '{}',           -- Detailed category ratings
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

### **Service:** `BookingReviewsService`

### **Features:**
- ⭐ **Rich Rating System**: 1-5 stars + category-specific ratings
- 📝 **Detailed Reviews**: Optional title + required content (50-500 chars)
- 🔄 **Bidirectional**: Host→Guest and Guest→Host reviews
- 📊 **Categories**: Communication, cleanliness, location, etc.
- 🎯 **Context-Aware**: Shows race and property information

### **Used In:**
- ✅ **Discover Page**: Race cards with dynamic host ratings
- ✅ **Race Detail Modal**: Host reviews and ratings
- ✅ **Profile Reviews Section**: Full review management
- ✅ **Guest Info Modal**: User's received reviews
- ✅ **Review Forms**: Creating new reviews after completed bookings

---

## 🏠 **2. House Swap Reviews System (`reviews` table)**

### **Purpose:** 
Reviews for house swapping experiences (future feature).

### **Database Structure:**
```sql
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY,
  reviewer_id uuid NOT NULL,               -- Who wrote the review
  reviewed_house_id uuid NOT NULL,         -- Which house is being reviewed
  swap_request_id uuid NOT NULL,           -- Links to swap_requests table
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,                            -- Optional comment
  created_at timestamp with time zone DEFAULT now()
);
```

### **Service:** `HouseReviewsService`

### **Features:**
- ⭐ **Simple Rating**: 1-5 stars
- 💬 **Optional Comments**: Basic text feedback
- 🏠 **House-Focused**: Reviews specific houses, not people
- 🔄 **Swap Context**: Linked to house swap requests

### **Used In:**
- 🚧 **Not yet implemented** (prepared for future house swapping feature)

---

## 🛠️ **Implementation Architecture**

### **Service Layer Structure:**
```typescript
// Main unified service (backward compatibility)
ReviewsService {
  // Delegates to BookingReviewsService for current features
  getReviewsForRace()
  getReviewsForProperty() 
  getReviewsForHost()
  getRatingStatsForRace()
  getRatingStatsForProperty()
  getRatingStatsForHost()
  createBookingReview()
  
  // Delegates to HouseReviewsService for future features
  getReviewsForHouse()
  getReviewsByReviewer()
  getRatingStatsForHouse()
  createHouseReview()
}

// Specific services for each system
BookingReviewsService { /* Race booking reviews */ }
HouseReviewsService { /* House swap reviews */ }
```

### **Component Usage:**
```typescript
// For race/property booking reviews
import { ReviewsService } from '@/services/reviews/properReviewsService';

// Get race-specific reviews
const { reviews, stats } = await ReviewsService.getReviewsForRace(raceId);

// Get host's overall reviews  
const { reviews, stats } = await ReviewsService.getReviewsForHost(hostId);

// Create a booking review
await ReviewsService.createBookingReview({
  booking_id: bookingId,
  reviewer_id: userId,
  reviewee_id: hostId,
  rating: 5,
  title: "Amazing experience!",
  content: "The host was fantastic...",
  review_type: "guest_to_host",
  categories: { communication: 5, cleanliness: 4 }
});
```

---

## 🎯 **Current Implementation Status**

### ✅ **Fully Implemented - Booking Reviews:**
- Dynamic ratings on race cards
- Contextual reviews in race details
- Complete review management in profile
- Review creation forms with categories
- Statistics and calculations
- Proper error handling and loading states

### 🚧 **Ready for Implementation - House Reviews:**
- Service layer complete
- Database structure matches schema
- Awaiting house swapping feature development

---

## 🔄 **Review Flow Process**

### **Booking Reviews Flow:**
1. **User books race experience** → Booking created
2. **Experience completed** → Booking status = "completed"  
3. **Review opportunity appears** → Profile → Reviews → Pendientes
4. **User writes review** → Detailed form with ratings + categories
5. **Review stored** → `booking_reviews` table
6. **Dynamic ratings update** → Shown across app (race cards, host cards, etc.)

### **House Reviews Flow (Future):**
1. **User requests house swap** → Swap request created
2. **Swap completed** → House experience finished
3. **User reviews house** → Simple rating + comment
4. **Review stored** → `reviews` table
5. **House ratings update** → Shown in house listings

---

## 📊 **Data Relationships**

### **Booking Reviews:**
```
booking_reviews → bookings → races/properties
booking_reviews → profiles (reviewer/reviewee)
```

### **House Reviews:**
```
reviews → swap_requests → houses
reviews → profiles (reviewer)
```

This architecture ensures proper separation of concerns and maintains data integrity according to your database schema! 🎉
