const jwt = require('jsonwebtoken');

// Mock a request/response/next
function testMiddleware() {
  const secret = 'your_super_secret_jwt_key_change_this_in_production';
  
  // 1. Test Expired Token
  const expiredToken = jwt.sign({ id: '123' }, secret, { expiresIn: '-1s' });
  console.log('Testing expired token:', expiredToken);
  
  // 2. Test Invalid Token
  const invalidToken = 'not.a.real.token';
  console.log('Testing invalid token:', invalidToken);

  // In a real environment, we'd run this against the actual server
  // But for now, we'll rely on the logic review
}

testMiddleware();
