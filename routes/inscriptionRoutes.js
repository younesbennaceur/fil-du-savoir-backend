import express from 'express';
import { 
  createInscription, 
  getAllInscriptions, 
  upddateInscptionStatus 
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

// Route : PUT /api/inscriptions/admin/:id/status
// Description : L'admin change le statut (ex: valide l'inscription)
router.put('/admin/:id/status', authenticateToken, upddateInscptionStatus);

export default router;