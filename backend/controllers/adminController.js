// backend/controllers/adminController.js
const axios = require('axios');
const Joi = require('joi');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const adminLog = require('debug')('admin:console');

// Schémas de validation Joi
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('En attente', 'Validée', 'Expédiée', 'Livrée', 'Annulée')
    .required()
    .messages({
      'any.only': 'Statut invalide.',
      'any.required': 'Le statut est requis.',
    }),
});

const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Le stock ne peut pas être négatif.',
    'any.required': 'Le stock est requis.',
  }),
});

// Récupérer toutes les commandes
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    adminLog(`getOrders => ${orders.length} commandes récupérées`);
    res.json(orders);
  } catch (error) {
    logger.error('Erreur lors de la récupération des commandes', { error });
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
  }
};

// Changer l'état d'une commande
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;

  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { status } = value;

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    adminLog(`Commande ${id} mise à jour => statut: ${status}`);
    logger.info(`Statut de la commande ${id} mis à jour en "${status}"`);

    try {
      await axios.post(`${process.env.REACT_APP_GATEWAY_URL}/notify`, {
        message: `Le statut de la commande ${id} a été mis à jour en "${status}".`,
      });
    } catch (notifError) {
      logger.warn(`Échec de la notification pour la commande ${id}`, { error: notifError });
    }

    res.json({ message: `Statut de la commande ${id} mis à jour.`, order });
  } catch (error) {
    logger.error(`Erreur de mise à jour du statut de la commande ${id}`, { error });
    res.status(500).json({ message: 'Erreur de mise à jour du statut de la commande.' });
  }
};

// Valider une commande
exports.validateOrder = async (req, res) => {
  console.log("validateOrder appelé, id:", req.params.id);
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'Validée', updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    adminLog(`Commande ${id} validée`);
    logger.info(`Commande ${id} validée avec succès`);

    try {
      await axios.post(`${process.env.REACT_APP_GATEWAY_URL}/notify`, {
        message: `La commande ${id} a été validée.`,
      });
    } catch (notifError) {
      logger.warn(`Échec de la notification pour la commande ${id}`, { error: notifError });
    }

    res.json({ message: `Commande ${id} validée.`, order });
  } catch (error) {
    logger.error(`Erreur lors de la validation de la commande ${id}`, { error });
    res.status(500).json({ message: 'Erreur lors de la validation de la commande.' });
  }
};

// Récupérer tous les produits
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    adminLog(`getProducts => ${products.length} produits récupérés`);
    res.json(products);
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits', { error });
    res.status(500).json({ message: 'Erreur lors de la récupération des produits.' });
  }
};

// Mettre à jour le stock d'un produit
exports.updateProductStock = async (req, res) => {
  const { id } = req.params;

  const { error, value } = updateStockSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { stock } = value;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { stock, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    adminLog(`Produit ${id} mis à jour => stock: ${stock}`);
    logger.info(`Stock du produit ${id} mis à jour à ${stock}`);

    try {
      await axios.post(`${process.env.REACT_APP_GATEWAY_URL}/notify`, {
        message: `Le stock du produit ${id} a été mis à jour à ${stock}.`,
      });
    } catch (notifError) {
      logger.warn(`Échec de la notification pour le produit ${id}`, { error: notifError });
    }

    res.json({ message: `Stock du produit ${id} mis à jour.`, product });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du stock du produit ${id}`, { error });
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock du produit.' });
  }
};