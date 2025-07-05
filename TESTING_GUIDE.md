# 🧪 Messaging System Test Setup Guide

This guide provides comprehensive test data for your messaging system. Follow these steps to test all messaging functionality.

## 📋 **Step-by-Step Testing Process**

### **1. Apply the Fixed Migration**
First, make sure you've applied the fixed migration:
```sql
-- Run this in Supabase SQL Editor
-- Copy and paste: 20250704180000-real-time-messaging-system-fixed.sql
```

### **2. Create Test Data**
Run the comprehensive test data setup:
```sql
-- Run this in Supabase SQL Editor
-- Copy and paste: comprehensive-test-data-setup.sql
```

### **3. Verify Test Data**
Check that everything was created correctly:
```sql
-- Run this in Supabase SQL Editor
-- Copy and paste: verify-test-data.sql
```

---

## 🎭 **Test Scenarios Created**

### **Test Users (Profiles)**
- **3 Test Hosts**: Can receive booking requests and respond to messages
- **3 Test Guests**: Can make bookings and send messages
- All users have realistic profiles with ratings and verification status

### **Test Properties**
1. **Madrid Marathon Base** - Madrid Centro, perfect for marathoners
2. **Barcelona Trail Paradise** - Mountain access for trail runners  
3. **Valencia Beach Runner Loft** - Coastal running paradise

### **Test Races**
1. **Madrid Marathon 2024** - Road race, flat course, multiple distances
2. **Barcelona Trail Challenge** - Technical trail race with elevation
3. **Valencia Sunrise Beach Run** - Early morning coastal run

### **Test Bookings (Enable Messaging)**
1. **Accepted Booking**: Madrid Marathon (has conversation thread)
2. **Pending Booking**: Barcelona Trail (host can respond)  
3. **Confirmed Booking**: Valencia Beach Run (ready for arrival)

### **Test Messages**
- Initial conversation starters
- Host responses with local tips
- Guest questions and confirmations
- Realistic pre-race communication

---

## 🧪 **How to Test**

### **Option 1: Use Existing Auth Users**
1. Check your `auth.users` table for existing users
2. The script automatically creates profiles for existing users
3. Login with existing user credentials

### **Option 2: Create New Test Users**
1. Register new users through your app's registration system
2. Use test emails like:
   - `testhost1@example.com` 
   - `testguest1@example.com`
3. The profiles will be created automatically

### **Testing Workflow**

1. **Login as Guest User**
   - Go to `/bookings`
   - See test bookings
   - Click "Message" button
   - Send a message

2. **Login as Host User** (different browser/incognito)
   - Go to `/messages`
   - See unread conversation
   - Reply to guest message
   - Test real-time updates

3. **Test Real-Time Features**
   - Keep both browser windows open
   - Send messages from either side
   - Verify instant delivery
   - Test typing indicators
   - Check unread count updates

---

## 📊 **What You'll See**

### **In the Bookings Page (`/bookings`)**
- 3 test bookings with different statuses
- "Message" buttons on bookings
- Booking details and participant information

### **In the Messages Page (`/messages`)**
- Conversation list with unread counts
- Different conversation statuses
- Search and filter functionality
- Real-time message updates

### **In Chat Interface**
- Message history
- Real-time message delivery
- Typing indicators
- Read receipts
- User avatars and names

---

## 🔍 **Verification Queries**

### **Check Current Auth Users**
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at;
```

### **Check Test Conversations**
```sql
SELECT 
  c.id,
  p1.first_name || ' & ' || p2.first_name as participants,
  c.last_message,
  c.unread_count_p1 + c.unread_count_p2 as total_unread
FROM conversations c
JOIN profiles p1 ON c.participant_1_id = p1.id
JOIN profiles p2 ON c.participant_2_id = p2.id;
```

### **Test Unread Count Function**
```sql
-- Replace with actual user ID
SELECT get_user_unread_count('your-user-id-here');
```

---

## 🧹 **Cleanup (Optional)**

When you're done testing, you can clean up:
```sql
-- Run: cleanup-test-data.sql
-- This removes all test data but preserves user profiles
```

---

## 🐛 **Troubleshooting**

### **"No conversations found"**
- Check that bookings exist between test users
- Verify foreign key relationships are correct
- Run the verification script

### **"Access denied" errors**
- Make sure you're logged in as one of the test users
- Verify RLS policies are applied correctly
- Check user IDs match in booking participants

### **Messages not appearing real-time**
- Check browser console for subscription errors
- Verify Supabase Realtime is enabled
- Refresh browser and try again

### **Frontend query errors**
- Make sure you applied the FIXED migration
- Check foreign key relationships in database
- Verify conversation table has correct structure

---

## 📝 **Expected Test Flow**

1. ✅ **Setup**: Run migration + test data scripts
2. ✅ **Login**: Use test user credentials  
3. ✅ **Navigate**: Go to `/bookings` or `/messages`
4. ✅ **Message**: Click "Message" button or open conversation
5. ✅ **Chat**: Send and receive messages in real-time
6. ✅ **Test**: Multiple users, typing indicators, unread counts
7. ✅ **Verify**: All features working without console errors

---

Now you have a complete testing environment for the messaging system! 🚀
