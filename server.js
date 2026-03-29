import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// ── Import des Routes ──
import authRoutes from './routes/authRoutes.js';
import inscriptionRoutes from './routes/inscriptionRoutes.js';

// 1. Charger les variables secrètes (.env)
dotenv.config();

// 2. Initialiser l'application Express
const app = express();

// 3. Connexion à la base de données MongoDB
connectDB();

// 4. Middlewares Globaux
app.use(cors()); 
app.use(express.json()); 

// 5. Définition des points d'accès (Endpoints API)
app.use('/api/auth', authRoutes);
app.use('/api/inscriptions', inscriptionRoutes);

// 6. Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Fil du Savoir démarré avec succès sur le port ${PORT}`);
});