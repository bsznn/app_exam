// backend/controllers/orderController.js
const axios = require('axios');
const Joi = require('joi');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const orderLog = require('debug')('order:console');

// Schémas de validation Joi
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          'any.required': 'Le productId est requis.',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'La quantité doit être au moins 1.',
          'any.required': 'La quantité est requise.',
        }),
        price: Joi.number().min(0).required().messages({
          'number.min': 'Le prix ne peut pas être négatif.',
          'any.required': 'Le prix est requis.',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'La commande doit contenir au moins un article.',
      'any.required': 'Les articles sont requis.',
    }),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  paymentMethod: Joi.string().required().messages({
    'any.required': 'Le mode de paiement est requis.',
  }),
  shippingMethod: Joi.string().required().messages({
    'any.required': 'Le mode de livraison est requis.',
  }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('En attente', 'Validée', 'Expédiée', 'Livrée', 'Annulée')
    .required()
    .messages({
      'any.only': 'Statut invalide.',
      'any.required': 'Le statut est requis.',
    }),
});

exports.createOrder = async (req, res) => {
  const { error, value } = createOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { items, shippingAddress, paymentMethod, shippingMethod } = value;
  const userId = req.user.userId;

  try {
    const orderDetails = items.map(({ productId, quantity, price }) => ({
      productId,
      quantity,
      price,
    }));

    const total = items.reduce((acc, { price, quantity }) => acc + price * quantity, 0);

    const newOrder = new Order({
      userId,
      items: orderDetails,
      total,
      shippingAddress,
      paymentMethod,
      shippingMethod,
    });

    const savedOrder = await newOrder.save();

    orderLog(`Commande créée : ${savedOrder._id} pour userId: ${userId}`);
    logger.info(`Nouvelle commande créée`, { orderId: savedOrder._id, userId });

    try {
      await axios.post(`${process.env.GATEWAY_URL}/notify`, {
        to: process.env.NOTIFY_EMAIL,
        subject: 'Nouvelle Commande Créée',
        text: `Une commande a été créée avec succès pour les produits suivants :\n${orderDetails
          .map((item) => `Produit ID : ${item.productId}, Quantité : ${item.quantity}`)
          .join('\n')}`,
      });
    } catch (notifError) {
      logger.warn("Échec de l'envoi de la notification de commande", { error: notifError });
    }

    res.status(201).json({
      message: 'Commande créée avec succès.',
      order: savedOrder,
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la commande', { error });
    res.status(500).json({ message: 'Une erreur est survenue lors de la création de la commande.' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "L'identifiant de la commande est requis." });
  }

  try {
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    orderLog(`Commande supprimée : ${orderId}`);
    logger.info(`Commande supprimée`, { orderId });

    res.status(200).json({ message: `Commande ${orderId} supprimée avec succès.` });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la commande ${orderId}`, { error });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    orderLog(`${orders.length} commandes récupérées`);
    res.status(200).json(orders);
  } catch (error) {
    logger.error('Erreur lors de la récupération des commandes', { error });
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
  }
};

exports.validateOrder = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "L'identifiant de la commande est requis." });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Validée', updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    orderLog(`Commande validée : ${orderId}`);
    logger.info(`Commande validée`, { orderId });

    res.status(200).json({ message: `Commande ${orderId} validée avec succès.`, order });
  } catch (error) {
    logger.error(`Erreur lors de la validation de la commande ${orderId}`, { error });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;

  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { status } = value;

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    orderLog(`Commande ${orderId} => statut mis à jour : ${status}`);
    logger.info(`Statut de la commande mis à jour`, { orderId, status });

    res.status(200).json({ message: 'Statut mis à jour avec succès.', order });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la commande ${orderId}`, { error });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};