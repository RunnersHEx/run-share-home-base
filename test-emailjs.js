// Quick test function to debug EmailJS recipient issue
// Add this to browser console to test

async function testEmailJS() {
  const emailjs = window.emailjs;
  
  // Test with minimal parameters
  const testParams = {
    to_email: 'syedhamza2381@gmail.com',
    message: 'Test message',
    verification_code: '123456'
  };
  
  console.log('Testing EmailJS with minimal params:', testParams);
  
  try {
    const result = await emailjs.send(
      'service_t9ggecb',
      'template_a99nx52', 
      testParams,
      '6wpESB8nMdxEvm6LA'
    );
    console.log('✅ Test successful:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error text:', error.text);
  }
}

// Run the test
testEmailJS();
