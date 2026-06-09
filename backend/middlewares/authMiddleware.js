// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const authLog = require('debug')('auth:middleware');

exports.authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

  authLog(`Vérification du token`);

  if (!token) {
    return res.status(401).json({ error: true, message: 'Token manquant. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    authLog(`Token valide pour userId: ${decoded.userId}`);
    next();
  } catch (error) {
    logger.warn('Token invalide ou expiré', { error });
    return res.status(403).json({ error: true, message: 'Token invalide ou expiré.' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Accès admin refusé pour userId: ${req.user?.userId}`);
    return res.status(403).json({ message: 'Accès interdit : droits administrateur requis.' });
  }
  next();
};