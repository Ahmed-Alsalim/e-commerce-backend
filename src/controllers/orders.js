const sql = require('../config/db');

async function createOrder({ body, user }, res) {
  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
    console.error('Order creation failed: No items provided');
    return res.status(400).send('Order items are required');
  }
  if (!body?.addressId) {
    console.error('Order creation failed: No address ID provided');
    return res.status(400).send('Address ID is required');
  }

  try {
    const result = await sql`INSERT INTO orders (
        account_id, address_id, status_id
      ) VALUES (${user.id}, ${body.addressId}, 1)
        RETURNING id`;
    const orderId = result[0].id;

    body.items.forEach(async (item) => {
      await sql`INSERT INTO order_items (
          order_id, product_id,
          quantity, price
        ) VALUES (
          ${orderId}, ${item.productId},
          ${item.quantity}, ${item.price}
        )`;
    });

    res.status(201).send({ id: orderId });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

async function getOrders(req, res) {
  const accountId = req.user.id;
  try {
    const orders =
      await sql`SELECT * FROM orders WHERE account_id = ${accountId}`;
    orders.forEach(async (order) => {
      const items =
        await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;
      order.items = items;
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

module.exports = {
  createOrder,
  getOrders,
};
