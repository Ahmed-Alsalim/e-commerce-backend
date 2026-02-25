const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sql = require('../config/db');

async function getProductsByIds(ids) {
  const products = await sql`SELECT id, name, price, discount FROM products WHERE id = ANY(${ids})`;
  return products;
}

async function createCheckoutSession(req, res) {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Items are required');
  }
  const hasInvalidItem = items.some(
    (item) =>
      !item ||
      item.productId === undefined ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1,
  );
  if (hasInvalidItem) {
    return res.status(400).send('Invalid items payload');
  }

  try {
    const productIds = items.map((item) => item.productId);
    const products = await getProductsByIds(productIds);
    const missingIds = productIds.filter(
      (id) => !products.some((p) => String(p.id) === String(id)),
    );
    if (missingIds.length > 0) {
      return res.status(400).send('Invalid productId');
    }

    const lineItems = items.map((item) => {
      const product = products.find(
        (p) => String(p.id) === String(item.productId),
      );
      const price = Number(product.price);
      const discount = Number(product.discount || 0);
      if (!Number.isFinite(price) || !Number.isFinite(discount)) {
        return null;
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round((price - discount) * 100),
        },
        quantity: item.quantity,
      };
    });
    if (lineItems.some((li) => li === null)) {
      return res.status(500).send('Invalid product pricing');
    }

    const params = {
      line_items: lineItems,
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: `${process.env.BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    };
    if (req.user?.email) {
      params.customer_email = req.user.email;
    }

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).send({ clientSecret: session.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

async function sessionStatus(req, res) {
  const sessionId = req.query?.session_id;
  if (!sessionId) {
    return res.status(400).send('session_id is required');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).send({
      status: session.status,
      customer_email: session.customer_details?.email ?? null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

module.exports = {
  createCheckoutSession,
  sessionStatus,
};
