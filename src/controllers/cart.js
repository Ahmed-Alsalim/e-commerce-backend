const sql = require('../config/db');

async function getCart(req, res) {
  const accountId = req.user.id;
  try {
    const cart =
      await sql`SELECT * FROM cart_items WHERE account_id = ${accountId}`;
    res.status(200).json(cart || []);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function addOrUpdateItem(req, res) {
  const accountId = req.user.id;
  const { productId, quantity } = req.body || {};

  if (!productId || typeof quantity !== 'number') {
    return res.status(400).send('Product ID and valid quantity are required');
  }

  if (quantity === 0) {
    try {
      await sql`DELETE FROM cart_items WHERE account_id = ${accountId} AND product_id = ${productId}`;

      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  try {
    await sql`INSERT INTO cart_items (account_id, product_id, quantity) VALUES (${accountId}, ${productId}, ${quantity}) ON CONFLICT (account_id, product_id) DO UPDATE SET quantity = ${quantity}`;

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).send(error.message);
  }
}

async function clearCart(req, res) {
  const accountId = req.user.id;
  try {
    await sql`DELETE FROM cart_items WHERE account_id = ${accountId}`;
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  getCart,
  addOrUpdateItem,
  clearCart,
};
