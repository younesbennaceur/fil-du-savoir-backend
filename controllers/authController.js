import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Chercher si l'admin existe dans la base
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }
        
        // 2. Comparer le mot de passe fourni avec celui de la base
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }

        // 3. Si tout est bon, créer un token JWT
        const token = jwt.sign(
            { userId: user._id }, // Payload du token
            process.env.JWT_SECRET, // Clé secrète pour signer le token
            { expiresIn: '24h' } // Durée de validité du token
        );

        // 👇 LA LIGNE QUI MANQUAIT EST ICI 👇
        // On renvoie le token au site web pour qu'il ouvre la porte !
        res.status(200).json({ token: token });

    } catch (error) {
        console.error("Erreur lors de l'authentification :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};