require('dotenv').config();
const bcrypt = require('bcrypt');
const { User } = require('../models');

async function updateAdminPassword() {
  console.log('🔑 Mise à jour du mot de passe admin');
  
  try {
    const admin = await User.findOne({ where: { email: 'admin@3lm-solutions.com' } });
    
    if (!admin) {
      console.error('❌ Utilisateur admin non trouvé');
      return;
    }
    
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await admin.update({ password: hashedPassword });
    
    console.log('✅ Mot de passe admin mis à jour');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    
    // Test de connexion
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`   Test de validation: ${isValid ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

updateAdminPassword();