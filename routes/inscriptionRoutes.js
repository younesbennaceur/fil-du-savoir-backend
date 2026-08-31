import express from 'express';
import { 
  createInscription, 
  getAllInscriptions, 
  updateInscriptionStatus,
  testEmailConfiguration,
  getInscriptionStats
} from '../controllers/inscriptionController.js';
import authenticateToken from '../middleware/auth.js'; // Notre vigile

const router = express.Router();

// 🟢 Route PUBLIQUE (Pas besoin de vigile)
// Route : POST /api/inscriptions/
// Description : Un parent soumet le formulaire sur le site
router.post('/', createInscription);

// 🔴 Routes PRIVÉES (Protégées par le vigile 'auth')
// Route : GET /api/inscriptions/admin
// Description : L'admin récupère la liste de toutes les inscriptions
router.get('/admin', authenticateToken, getAllInscriptions);

// Test ciblé de la configuration e-mail, sans créer ni lire de dossier.
router.post('/admin/test-email', authenticateToken, testEmailConfiguration);

// Statistiques agrégées sans exposer les données personnelles.
router.get('/admin/stats', authenticateToken, getInscriptionStats);

// Route : PUT /api/inscriptions/admin/:id/status
// Description : L'admin change le statut (ex: valide l'inscription)
router.put('/admin/:id/status', authenticateToken, updateInscriptionStatus);

export default router;
