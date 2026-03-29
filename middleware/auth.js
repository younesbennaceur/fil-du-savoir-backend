import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: "Accès refusé. Aucun token." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

// C'EST CETTE LIGNE QUI MANQUAIT OU QUI N'AVAIT PAS 'default'
export default authenticateToken;