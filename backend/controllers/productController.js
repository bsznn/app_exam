// backend/controllers/productController.js
const Joi = require('joi');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const productLog = require('debug')('product:console');

const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Le stock ne peut pas être négatif.',
    'any.required': 'Le stock est requis.',
  }),
});

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    productLog(`${products.length} produits récupérés`);
    res.json(products);
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits', { error });
    res.status(500).json({ message: 'Erreur lors de la récupération des produits.' });
  }
};

exports.updateProductStock = async (req, res) => {
  const { productId } = req.params;

  const { error, value } = updateStockSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { stock } = value;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    product.stock = stock;
    product.updatedAt = Date.now();
    await product.save();

    productLog(`Produit ${productId} => stock mis à jour à ${stock}`);
    logger.info(`Stock du produit ${productId} mis à jour à ${stock}`);

    res.json({ message: 'Stock mis à jour avec succès.', product });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du stock du produit ${productId}`, { error });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};