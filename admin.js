import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.js';

// 1. Charger les variables secrètes (.env)
dotenv.config();

const createAdmin = async () => {
  try {
    // 2. Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB...");

    // 👇 TES IDENTIFIANTS ICI 👇
    const email = "contact@fildusavoir.fr"; 
    const password = "fildusavoir@admin2026"; 

    // 3. Vérifier si ce compte existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("⚠️ Un administrateur avec cet email existe déjà. Tu peux déjà te connecter avec !");
      process.exit();
    }

    // 4. Sécuriser (crypter) le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Sauvegarder l'admin dans la base de données
    const admin = new User({ 
      email: email, 
      password: hashedPassword 
    });
    
    await admin.save();

    console.log(`🎉 SUCCÈS ! Compte créé avec l'email : ${email}`);
    process.exit();
  } catch (error) {
    console.error("❌ Erreur lors de la création :", error);
    process.exit(1);
  }
};

// Lancer la fonction
createAdmin();