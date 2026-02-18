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
    const address =
      await sql`SELECT id FROM addresses WHERE id = ${body.addressId} AND account_id = ${user.id}`;
    if (address.length === 0) {
      return res.status(404).send('Address not found');
    }

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
    const orders = await sql`
      WITH orders_filtered AS (
        SELECT
          o.id,
          o.account_id,
          o.status_id,
          o.created_at,
          CASE
            WHEN a.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', a.id,
              'street1', a.street1,
              'street2', a.street2,
              'city', a.city,
              'zip', a.zip,
              'country', a.country
            )
          END AS address
        FROM orders o
        LEFT JOIN addresses a ON a.id = o.address_id AND a.account_id = o.account_id
        WHERE o.account_id = ${accountId}
      ),
      order_products AS (
        SELECT DISTINCT oi.product_id
        FROM order_items oi
        JOIN orders_filtered o ON o.id = oi.order_id
        WHERE oi.product_id IS NOT NULL
      ),
      primary_images AS (
        SELECT DISTINCT ON (pi.product_id)
          pi.product_id,
          pi.url
        FROM product_images pi
        JOIN order_products op ON op.product_id = pi.product_id
        ORDER BY pi.product_id, pi.id ASC
      ),
      items AS (
        SELECT
          oi.order_id,
          json_agg(
            json_build_object(
              'item_id', oi.id,
              'quantity', oi.quantity,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'code', p.code,
                'price', p.price,
                'description', p.description,
                'image', pi.url
              )
            )
            ORDER BY oi.id ASC
          ) AS items
        FROM order_items oi
        JOIN orders_filtered o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN primary_images pi ON pi.product_id = oi.product_id
        GROUP BY oi.order_id
      )
      SELECT
        o.*,
        COALESCE(i.items, '[]'::json) AS items
      FROM orders_filtered o
      LEFT JOIN items i ON i.order_id = o.id
      ORDER BY o.created_at DESC
    `;

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
