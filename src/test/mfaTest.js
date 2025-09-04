// Simple test script to verify MFA functionality
// Run this in the browser console to test the MFA system

import { 
  requiresMFA, 
  generateAndSendMFACode, 
  verifyMFACode, 
  clearMFACode,
  isMFACodeVerified 
} from './src/services/mfa/mfaService';

// Test MFA functionality
async function testMFA() {
  console.log('🧪 Testing MFA System');
  console.log('===================');
  
  const adminEmail = 'syedhamza2381@gmail.com';
  const nonAdminEmail = 'user@example.com';
  
  // Test 1: Check MFA requirement
  console.log('Test 1: MFA Requirement Check');
  console.log(`Admin email requires MFA: ${requiresMFA(adminEmail)}`); // Should be true
  console.log(`Non-admin email requires MFA: ${requiresMFA(nonAdminEmail)}`); // Should be false
  
  // Test 2: Generate and send MFA code for admin
  console.log('\\nTest 2: Generate MFA Code for Admin');
  const result = await generateAndSendMFACode(adminEmail);
  console.log('Result:', result);
  
  if (result.success) {
    // Test 3: Verify with wrong code
    console.log('\\nTest 3: Verify with Wrong Code');
    const wrongResult = verifyMFACode(adminEmail, '000000');
    console.log('Wrong code result:', wrongResult);
    
    // Test 4: Verify with correct code (you'll need to get this from console)
    console.log('\\nTest 4: Get the correct code from console logs above');
    console.log('Then run: verifyMFACode("syedhamza2381@gmail.com", "YOUR_CODE")');
  }
  
  // Test 5: Test non-admin email
  console.log('\\nTest 5: Non-admin Email MFA (should fail)');
  const nonAdminResult = await generateAndSendMFACode(nonAdminEmail);
  console.log('Non-admin result:', nonAdminResult);
  
  console.log('\\n✅ MFA Tests Completed');
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testMFA = testMFA;
  console.log('MFA test function loaded. Run testMFA() to start testing.');
}
