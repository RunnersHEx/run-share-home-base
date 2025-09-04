# Account Deletion Implementation

## Overview
This document describes the complete account deletion functionality implemented for the RunnersHEx platform.

## Architecture

### Edge Function (`/supabase/functions/delete-user/index.ts`)
The account deletion is handled server-side using a Supabase Edge Function that:

1. **Validates the request**:
   - Verifies JWT token (user must be authenticated)
   - Checks confirmation text matches exactly "ELIMINAR MI CUENTA"
   - Verifies user exists in auth system

2. **Deletes user data in correct order**:
   - Booking messages
   - Booking reviews (given and received)
   - Bookings (as guest and host)
   - Conversations
   - Points transactions
   - Verification requests
   - Subscriptions
   - User notifications
   - Property-related data (images, availability)
   - User properties
   - Race-related data (images)
   - User races
   - User profile
   - Storage files (avatars, verification docs)
   - Auth user (final step)

3. **Error handling**:
   - Continues with deletion even if some steps fail
   - Provides detailed logging
   - Returns success even if auth deletion fails (data still removed)

### Client Component (`/src/components/profile/DeleteAccountSection.tsx`)
The UI component:
- Provides clear warnings about irreversible action
- Requires exact confirmation text
- Requires checkbox confirmation
- Calls the Edge Function
- Handles success/error responses
- Signs out user after successful deletion

## Configuration

### Supabase Config (`/supabase/config.toml`)
```toml
[functions.delete-user]
verify_jwt = true
```

### Environment Variables
The Edge Function uses:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Usage

1. User navigates to Profile > Delete Account
2. User reads warnings and enters confirmation text "ELIMINAR MI CUENTA"
3. User checks confirmation checkbox
4. User clicks delete button and confirms in dialog
5. System calls Edge Function
6. Edge Function deletes all user data
7. User is automatically signed out
8. Account is completely removed

## Security

- Function requires JWT authentication
- Uses service role key for admin operations
- Validates user exists before deletion
- Requires exact confirmation text match
- All operations are logged for audit trail

## Error Scenarios

1. **Invalid confirmation**: Returns 400 error
2. **User not found**: Returns 404 error  
3. **Data deletion issues**: Continues with remaining operations
4. **Auth deletion fails**: Still returns success (data is cleaned up)
5. **Network/server errors**: Returns 500 error

## Testing

To test account deletion:
1. Create a test user account
2. Add some data (properties, races, bookings, etc.)
3. Navigate to Profile > Delete Account
4. Complete deletion process
5. Verify user cannot log back in
6. Verify all data is removed from database
7. Verify files are removed from storage

## Deployment

The Edge Function is automatically deployed when pushing to the Supabase project. Ensure the `SUPABASE_SERVICE_ROLE_KEY` environment variable is set in the Supabase dashboard.
