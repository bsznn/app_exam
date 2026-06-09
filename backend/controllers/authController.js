// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const logger = require('../utils/logger');
const authLog = require('debug')('auth:console');
require('dotenv').config();

// Schémas de validation Joi
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    'any.required': "Le nom d'utilisateur est requis.",
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    'any.required': "Le nom d'utilisateur est requis.",
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Adresse email invalide.',
    'any.required': "L'email est requis.",
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

exports.login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, password } = value;
  authLog(`Tentative de connexion pour : ${username}`);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Échec de connexion pour l'utilisateur : ${username}`);
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    authLog(`Connexion réussie pour : ${username}`);
    logger.info(`Connexion réussie pour l'utilisateur : ${username}`);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1h en ms
    });

    res.json({ role: user.role, username: user.username, token });
  } catch (error) {
    logger.error('Erreur serveur lors de la connexion', { error });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, email, password } = value;
  authLog(`Tentative d'inscription pour : ${username} (${email})`);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const user = new User({ username, email, password });
    await user.save();

    authLog(`Utilisateur créé : ${username}`);
    logger.info(`Nouvel utilisateur enregistré : ${username} (${email})`);

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    logger.error("Erreur lors de l'inscription", { error });
    res.status(500).json({ message: 'Une erreur est survenue.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Déconnexion réussie.' });
};