const sql = require('../config/db');

async function getCart(req, res) {
  const accountId = req.user.id;
  try {
    const cart = await sql`
        SELECT
          c.id as cart_item_id, c.quantity,
          p.code, p.discount, p.name, p.price, p.quantity as stock, p.variant_code, p.description, p.id as product_id, 
          pi.url as image_url
        FROM
          cart_items c
          JOIN products p ON c.product_id = p.id
          LEFT JOIN lateral (select url FROM product_images WHERE product_id = p.id limit 1) pi ON true
        WHERE c.account_id = ${accountId};
      `;
    res.status(200).json(cart || []);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function addOrUpdateItem(req, res) {
  const accountId = req.user.id;
  const { product_id, quantity } = req.body || {};

  if (!product_id || typeof quantity !== 'number') {
    return res.status(400).send('Product ID and valid quantity are required');
  }

  if (quantity === 0) {
    try {
      await sql`DELETE FROM cart_items WHERE account_id = ${accountId} AND product_id = ${product_id}`;

      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  try {
    await sql`INSERT INTO cart_items (account_id, product_id, quantity) VALUES (${accountId}, ${product_id}, ${quantity}) ON CONFLICT (account_id, product_id) DO UPDATE SET quantity = ${quantity}`;

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
