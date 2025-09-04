# Points System Integration Guide

This document explains how to integrate the new comprehensive points system throughout the application.

## 🎯 Overview

The points system has been completely redesigned according to the requirements document with the following features:

### Point Awards
- **Hosting**: 40 points per night (automatic on booking completion)
- **Add Property**: 30 points (automatic on property creation)
- **Add Race**: 40 points (automatic on race creation, must be linked to property)
- **5-Star Review**: 15 points (automatic when receiving 5-star review)
- **Identity Verification**: 25 points (automatic on verification approval)
- **New Subscriber**: 30 points (automatic on first subscription)
- **Subscription Renewal**: 50 points (automatic on renewal)

### Provincial Booking Costs
Booking costs are now calculated based on the province where the race takes place:
- **Premium provinces** (Madrid, Barcelona, Valencia, Sevilla, Málaga): 60 points/night
- **High-demand provinces** (Castellón, Murcia, Tarragona, Zaragoza): 40 points/night
- **Medium-demand provinces**: 30 points/night
- **Low-demand provinces**: 20 points/night

### Penalties
- **Host Cancellation**: Lose the same points guest paid (or 100 points default)
- **Guest Late Cancellation**: No refund if cancelled less than 7 days before check-in

## 🗄️ Database Changes

### New Migration
A comprehensive migration file has been created: `20250811000001-comprehensive-points-system.sql`

Key changes:
- New table: `provincial_point_costs`
- New functions for automatic point awards
- Triggers for all point-awarding actions
- Enhanced booking cost calculation

### Automatic Triggers
The following actions now automatically award/deduct points:
- Property creation → 30 points
- Race creation → 40 points
- Booking completion → 40 points per night to host
- 5-star review → 15 points
- Identity verification approval → 25 points
- Subscription activation → 30/50 points
- Host cancellation → penalty + guest refund

## 🔧 Services & Utilities

### 1. PointsCalculationService
Updated to use provincial-based calculations:

```typescript
// Calculate booking cost using provincial system
const cost = await PointsCalculationService.calculateProvincialBookingCost({
  raceId: 'race-uuid',
  checkInDate: '2025-09-01',
  checkOutDate: '2025-09-03'
});

// Get provincial rate
const rate = PointsCalculationService.getProvincialPointsPerNight('Madrid'); // Returns 60

// Check user balance
const balance = await PointsCalculationService.getUserPointsBalance(userId);
```

### 2. PointsManagementService
New service for managing all point transactions:

```typescript
// Process booking payment
await PointsManagementService.processBookingPayment({
  bookingId: 'booking-uuid',
  guestId: 'guest-uuid',
  hostId: 'host-uuid',
  raceId: 'race-uuid',
  checkInDate: '2025-09-01',
  checkOutDate: '2025-09-03'
});

// Award specific points
await PointsManagementService.awardPropertyPoints(userId, propertyTitle);
await PointsManagementService.awardRacePoints(userId, raceName);
await PointsManagementService.awardVerificationPoints(userId);

// Get user summary
const summary = await PointsManagementService.getUserPointsSummary(userId);
```

### 3. PointsIntegrationUtils
Utility functions for easy integration:

```typescript
// Handle property creation
await PointsIntegrationUtils.handlePropertyCreated(userId, propertyTitle);

// Handle race creation
await PointsIntegrationUtils.handleRaceCreated(userId, raceName);

// Check booking affordability
const affordability = await PointsIntegrationUtils.checkBookingAffordability(
  userId, raceId, checkInDate, checkOutDate
);

// Format points for display
const formatted = PointsIntegrationUtils.formatPoints(1500); // "1,500"
```

## 🎣 React Hooks

### 1. usePoints
Main hook for user points management:

```typescript
const {
  balance,
  pointsSummary,
  transactions,
  loading,
  refreshBalance,
  checkSufficientPoints
} = usePoints(userId);
```

### 2. useBookingCost
Hook for calculating booking costs:

```typescript
const {
  cost,
  loading,
  calculateCost,
  getProvincialRate
} = useBookingCost();

// Calculate cost for specific booking
const bookingCost = await calculateCost(raceId, checkInDate, checkOutDate);
```

### 3. useBookingPayment
Hook for processing payments:

```typescript
const {
  processing,
  processPayment,
  processRefund
} = useBookingPayment();
```

### 4. usePointsActions
Hook for awarding points:

```typescript
const {
  awardPropertyPoints,
  awardRacePoints,
  awardVerificationPoints,
  awardSubscriptionPoints
} = usePointsActions();
```

## 🔌 Integration Examples

### Property Creation
```typescript
// In your property creation component
const { awardPropertyPoints } = usePointsActions();

const handlePropertySubmit = async (propertyData) => {
  try {
    // Create property
    const property = await PropertyService.createProperty(propertyData);
    
    // Points are automatically awarded by database trigger
    // But you can also manually trigger if needed:
    // await awardPropertyPoints(userId, property.title);
    
    toast.success('Property created! You earned 30 points!');
  } catch (error) {
    // Handle error
  }
};
```

### Race Creation
```typescript
// In your race creation component
const { awardRacePoints } = usePointsActions();

const handleRaceSubmit = async (raceData) => {
  try {
    // Ensure race is linked to a property
    if (!raceData.property_id) {
      throw new Error('Race must be linked to a property');
    }
    
    // Create race
    const race = await RaceService.createRace(raceData);
    
    // Points automatically awarded by trigger
    toast.success('Race created! You earned 40 points!');
  } catch (error) {
    // Handle error
  }
};
```

### Booking Flow
```typescript
// In your booking component
const { calculateCost } = useBookingCost();
const { processPayment } = useBookingPayment();
const { balance, checkSufficientPoints } = usePoints(userId);

const handleBookingRequest = async (bookingData) => {
  try {
    // Calculate cost
    const cost = await calculateCost(
      bookingData.raceId,
      bookingData.checkInDate,
      bookingData.checkOutDate
    );
    
    // Check if user can afford it
    const canAfford = await checkSufficientPoints(cost);
    if (!canAfford) {
      toast.error(`Insufficient points. Required: ${cost}, Available: ${balance}`);
      return;
    }
    
    // Create booking (payment processed automatically on acceptance)
    const booking = await BookingService.createBookingRequest(bookingData, userId);
    
    toast.success('Booking request sent!');
  } catch (error) {
    // Handle error
  }
};
```

### Review System
```typescript
// In your review component
const { awardReviewPoints } = usePointsActions();

const handleReviewSubmit = async (reviewData) => {
  try {
    // Submit review
    const review = await ReviewService.submitReview(reviewData);
    
    // Points automatically awarded by trigger if 5-star review
    if (reviewData.rating === 5) {
      toast.success('Thank you for the 5-star review! The reviewee earned 15 points!');
    }
  } catch (error) {
    // Handle error
  }
};
```

### Verification Process
```typescript
// In admin verification component
const { awardVerificationPoints } = usePointsActions();

const handleVerificationApproval = async (userId) => {
  try {
    // Approve verification
    await VerificationService.approveVerification(userId);
    
    // Points automatically awarded by trigger
    toast.success('Verification approved! User earned 25 points!');
  } catch (error) {
    // Handle error
  }
};
```

### Subscription Management
```typescript
// In subscription component
const { awardSubscriptionPoints } = usePointsActions();

const handleSubscriptionSuccess = async (userId, isRenewal = false) => {
  try {
    // Points automatically awarded by trigger
    const pointsAwarded = isRenewal ? 50 : 30;
    const message = isRenewal 
      ? 'Subscription renewed! You earned 50 points!' 
      : 'Welcome! You earned 30 points for subscribing!';
    
    toast.success(message);
  } catch (error) {
    // Handle error
  }
};
```

### Points Display Components
```typescript
// Points balance display
const PointsBalance = ({ userId }) => {
  const { balance, loading } = usePoints(userId);
  
  if (loading) return <Skeleton className="w-20 h-6" />;
  
  return (
    <div className="flex items-center gap-2">
      <Coins className="w-5 h-5 text-yellow-500" />
      <span className="font-semibold">
        {PointsIntegrationUtils.formatPoints(balance)} points
      </span>
    </div>
  );
};

// Points history component
const PointsHistory = ({ userId }) => {
  const { transactions, loading } = usePoints(userId);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="space-y-2">
      {transactions.map(transaction => (
        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
          <div className="flex items-center gap-2">
            <span>{PointsIntegrationUtils.getTransactionTypeIcon(transaction.type)}</span>
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-gray-500">
                {PointsIntegrationUtils.getTransactionTypeDisplayName(transaction.type)}
              </p>
            </div>
          </div>
          <span className={`font-semibold ${PointsIntegrationUtils.getPointsColor(transaction.amount)}`}>
            {transaction.amount > 0 ? '+' : ''}
            {PointsIntegrationUtils.formatPoints(transaction.amount)}
          </span>
        </div>
      ))}
    </div>
  );
};
```

## 🚀 Deployment Steps

1. **Run the migration**:
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```

2. **Update existing code**:
   - Replace old points calculations with new services
   - Add point award calls to property/race creation flows
   - Update booking cost calculations
   - Add points display components

3. **Test the system**:
   - Create properties/races and verify points are awarded
   - Make bookings and verify provincial costs
   - Test cancellation penalties
   - Verify review points
   - Test subscription points

## 🔧 Troubleshooting

### Common Issues

1. **Points not being awarded automatically**:
   - Check that triggers are installed correctly
   - Verify user ID exists in profiles table
   - Check database logs for trigger errors

2. **Booking costs incorrect**:
   - Verify race has province field set
   - Check provincial_point_costs table has all provinces
   - Ensure calculate_race_booking_cost function is working

3. **Insufficient points errors**:
   - Check user's actual points balance
   - Verify cost calculation is correct
   - Ensure checkSufficientPoints is working

### Database Functions
Key functions that should be available:
- `calculate_race_booking_cost()`
- `process_booking_with_provincial_points()`
- `get_provincial_points_per_night()`
- All award/penalty functions

## 📊 Monitoring & Analytics

Consider adding monitoring for:
- Points distribution across users
- Most popular provinces by booking cost
- Point award frequency by type
- User retention correlation with points earned

## ✅ Checklist

- [ ] Run migration file
- [ ] Update booking flow to use new cost calculation
- [ ] Add points display components
- [ ] Integrate point awards in property/race creation
- [ ] Update review system to award points
- [ ] Test all automatic point awards
- [ ] Verify cancellation penalties work
- [ ] Test provincial cost calculations
- [ ] Add points balance checks before bookings
- [ ] Update user dashboard with points summary

The points system is now fully implemented and ready for integration throughout your application!
