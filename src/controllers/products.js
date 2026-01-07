const sql = require('../config/db');

async function createProduct({ body }, res) {
  if (!body?.code) {
    return res.status(400).send('Product code is required');
  }
  try {
    await sql`INSERT INTO products (
        category, code, description,
        discount, image_url, variant_code,
        name, price, quantity
      ) VALUES (
        ${body.category}, ${body.code}, ${body.description},
        ${body.discount}, ${body.image_url}, ${body.variant_code},
        ${body.name}, ${body.price}, ${body.quantity}
      )`;

    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function updateProduct(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const result = await sql`UPDATE products SET
        category = ${req.body.category},
        code = ${req.body.code},
        description = ${req.body.description},
        discount = ${req.body.discount}
        image_url = ${req.body.image_url},
        name = ${req.body.name},
        price = ${req.body.price},
        quantity = ${req.body.quantity},
        variant_code = ${req.body.variant_code},
      WHERE id = ${id}`;
    if (result.count === 0) {
      return res.status(404).send('Product not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function listProducts(req, res) {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  try {
    const products =
      await sql`SELECT * FROM products LIMIT ${limit} OFFSET ${offset}`;
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
    const product = await sql`SELECT * FROM products WHERE id = ${id}`;
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
