import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // On se connecte en utilisant l'URL secrète de ton fichier .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Base de données MongoDB connectée : ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1); // Arrête le serveur en cas d'erreur grave
  }
};

export default connectDB;