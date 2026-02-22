const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sql = require('../config/db');

async function getProductsByIds(ids) {
  const products = await sql`SELECT id, name, price, discount FROM products WHERE id = ANY(${ids})`;
  return products;
}

async function createCheckoutSession(req, res) {
  const products = await getProductsByIds(req.body.items.map((item) => item.productId));
  const lineItems = req.body.items.map((item) => {
    const product = products.find((p) => p.id.toString() === item.productId.toString());
    return {
    price_data: {
      currency: 'gbp',
      product_data: {
        name: product.name,
      },
      unit_amount: (product.price - product.discount) * 100,
    },
    quantity: item.quantity,
  }});

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    customer_email: req.user.email,
    mode: 'payment',
    ui_mode: 'embedded',
    return_url: `${process.env.BASE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.send({ clientSecret: session.client_secret });
}

async function sessionStatus(req, res) {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email,
  });
}

module.exports = {
  createCheckoutSession,
  sessionStatus,
};
