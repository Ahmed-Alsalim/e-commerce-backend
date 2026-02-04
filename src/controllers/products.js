const sql = require('../config/db');

async function createProduct({ body }, res) {
  if (!body?.code) {
    return res.status(400).send('Product code is required');
  }
  try {
    const result = await sql`INSERT INTO products (
        category, code,
        description, discount,
        variant_code, name,
        price, quantity
      ) VALUES (
        ${body.category || null}, ${body.code},
        ${body.description || null}, ${body.discount || null},
        ${body.variant_code || null}, ${body.name || null},
        ${body.price || null}, ${body.quantity || null}
      )
        RETURNING id`;

    res.status(201).send({ id: result[0].id });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function updateProduct(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).send('Product ID is required');
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('At least one field is required to update');
  }

  try {
    const result = await sql`UPDATE products SET ${sql(
      req.body,
      Object.keys(req.body),
    )}
      WHERE id = ${id}
      RETURNING id`;

    if (result.count === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).send({ id: result[0].id });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function listProducts(req, res) {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  try {
    const products = await sql`
      select p.*, array_agg(pi.url) as image_url
      from products p
      join product_images pi on p.id = pi.product_id
      group by p.id
      LIMIT ${limit} OFFSET ${offset}
    `;
    res.status(200).json(products);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function getProductById(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).send('Product ID is required');
  }
  try {
    const product = await sql`
      select p.*, array_agg(pi.url) as image_url
      from products p
      join product_images pi on p.id = pi.product_id
      WHERE p.id = ${id}
      group by p.id
    `;
    if (product.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).json(product[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).send('Product ID is required');
  }
  try {
    const result = await sql`DELETE FROM products WHERE id = ${id}`;
    if (result.count === 0) {
      return res.status(404).send('Product not found');
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  createProduct,
  updateProduct,
  listProducts,
  getProductById,
  deleteProduct,
};
