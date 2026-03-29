import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// Route : POST /api/auth/login
// Description : Connecter l'admin
router.post('/login', login);

export default router;