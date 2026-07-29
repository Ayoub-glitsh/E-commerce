require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateTestToken() {
  // Utiliser l'ID de l'utilisateur admin existant
  const userId = 'b9b9958f-cb9d-4fda-bd55-b70b56e224bd';
  const email = 'admin@3lm-solutions.com';
  const role = 'admin';

  const payload = {
    userId: userId,
    email: email,
    role: role
  };

  const secret = process.env.JWT_SECRET || 'default-secret-key';
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  console.log('🔑 Token JWT généré:');
  console.log(`   User ID: ${userId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role: ${role}`);
  console.log(`   Token: ${token}`);
  console.log(`\n📋 Pour tester:`);
  console.log(`   Authorization: Bearer ${token}`);

  return token;
}

generateTestToken();