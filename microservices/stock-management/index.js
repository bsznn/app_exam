const express = require('express');
const app = express();
const PORT = process.env.PORT || 4003;

app.use(express.json());

app.post('/update-stock', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'productId et quantity sont requis.' });
    }

    res.status(200).json({ message: `Stock mis à jour pour le produit de ID : ${productId}` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock.', error });
  }
});

app.listen(PORT, () => {});