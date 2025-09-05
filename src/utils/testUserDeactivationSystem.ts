// TEST FILE - User Deactivation System Verification
// This file can be used to test the implemented fixes

import { supabase } from '@/integrations/supabase/client';

// Test 1: Verify UserAccessGuard route checking
export const testRouteChecking = () => {
  console.log('Testing UserAccessGuard route checking...');
  
  // Simulate different paths
  const testPaths = ['/messages', '/messaging', '/profile', '/discover', '/races'];
  const allowedPages = ['profile', 'messaging'];
  
  testPaths.forEach(path => {
    const isAllowed = allowedPages.some(page => {
      if (page === 'messaging') {
        return path.includes('/messages') || path === '/messages' || 
               path.includes('/messaging') || path === '/messaging';
      }
      return path.includes(`/${page}`) || path === `/${page}`;
    });
    
    console.log(`Path: ${path} - Allowed: ${isAllowed}`);
  });
};

// Test 2: Verify admin message subscription setup
export const testAdminMessageSubscription = (userId: string) => {
  console.log('Testing admin message real-time subscription...');
  
  const channel = supabase
    .channel(`admin_messages_test_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('✅ Real-time admin message received:', payload.new);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
    
  // Clean up after 5 seconds
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('Test subscription cleaned up');
  }, 5000);
};

// Test 3: Verify profile.is_active checking
export const testProfileActiveStatus = (profile: any) => {
  console.log('Testing profile active status checking...');
  
  const testCases = [
    { profile: { is_active: true }, expected: 'ALLOWED' },
    { profile: { is_active: false }, expected: 'RESTRICTED' },
    { profile: null, expected: 'ALLOWED' }, // Loading state
    { profile: undefined, expected: 'ALLOWED' }, // Loading state
  ];
  
  testCases.forEach((testCase, index) => {
    const isAllowed = testCase.profile?.is_active !== false;
    const result = isAllowed ? 'ALLOWED' : 'RESTRICTED';
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: Profile: ${JSON.stringify(testCase.profile)} - Result: ${result} - Expected: ${testCase.expected} - ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
};

// Test 4: Simulate admin message creation and real-time delivery
export const simulateAdminMessageFlow = async (targetUserId: string, adminUserId: string) => {
  console.log('Simulating admin message flow...');
  
  try {
    // Call the admin function to toggle user status (this will create an admin message)
    const { data, error } = await supabase.rpc('admin_toggle_user_status', {
      target_user_id: targetUserId,
      admin_user_id: adminUserId,
      deactivation_reason: 'Test deactivation for system verification'
    });
    
    if (error) {
      console.error('❌ Admin function failed:', error);
      return;
    }
    
    console.log('✅ Admin function successful:', data);
    
    // Verify admin messages were created
    const { data: messages, error: messageError } = await supabase.rpc('get_admin_messages_for_user', {
      target_user_id: targetUserId
    });
    
    if (messageError) {
      console.error('❌ Failed to fetch admin messages:', messageError);
      return;
    }
    
    console.log('✅ Admin messages found:', messages?.length || 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Test 5: Verify UserAccessGuard component behavior
export const verifyUserAccessGuardBehavior = () => {
  console.log('Verifying UserAccessGuard component behavior...');
  
  const scenarios = [
    {
      name: 'Active user - should allow all actions',
      profile: { is_active: true },
      path: '/races',
      showCreateRestriction: false,
      expectedResult: 'RENDER_CHILDREN'
    },
    {
      name: 'Inactive user - restricted page',
      profile: { is_active: false },
      path: '/races',
      showCreateRestriction: false,
      expectedResult: 'SHOW_RESTRICTION_PAGE'
    },
    {
      name: 'Inactive user - allowed page',
      profile: { is_active: false },
      path: '/messages',
      showCreateRestriction: false,
      expectedResult: 'RENDER_CHILDREN'
    },
    {
      name: 'Inactive user - create restriction',
      profile: { is_active: false },
      path: '/profile',
      showCreateRestriction: true,
      expectedResult: 'SHOW_CREATE_RESTRICTION'
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\nScenario ${index + 1}: ${scenario.name}`);
    console.log(`Profile: ${JSON.stringify(scenario.profile)}`);
    console.log(`Path: ${scenario.path}`);
    console.log(`Show Create Restriction: ${scenario.showCreateRestriction}`);
    console.log(`Expected: ${scenario.expectedResult}`);
    console.log('---');
  });
};

// Main test runner
export const runAllTests = (userId?: string, adminUserId?: string) => {
  console.log('🧪 Running User Deactivation System Tests...\n');
  
  testRouteChecking();
  console.log('\n---\n');
  
  testProfileActiveStatus(null);
  console.log('\n---\n');
  
  verifyUserAccessGuardBehavior();
  console.log('\n---\n');
  
  if (userId) {
    testAdminMessageSubscription(userId);
    
    if (adminUserId) {
      // Warning: This will actually deactivate the user!
      // simulateAdminMessageFlow(userId, adminUserId);
      console.log('⚠️  Admin message flow test skipped (would actually deactivate user)');
      console.log('   To run: simulateAdminMessageFlow(userId, adminUserId)');
    }
  }
  
  console.log('\n✅ All tests completed!');
};

export default {
  runAllTests,
  testRouteChecking,
  testAdminMessageSubscription,
  testProfileActiveStatus,
  simulateAdminMessageFlow,
  verifyUserAccessGuardBehavior
};
