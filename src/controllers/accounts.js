const sql = require('../config/db');
const { hash } = require('../utils/authHelper');
const passport = require('passport');

async function createAccount({ body }, res) {
  const { email, password } = body || {};
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const hashedPassword = await hash(password);

    const result =
      await sql`INSERT INTO accounts (email, password_hash, name) VALUES (${email}, ${hashedPassword}, ${
        body.name || null
      }) RETURNING id`;
    res.status(201).send({ id: result[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).send(info.message || 'Invalid email or password');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.sendStatus(200);
    });
  })(req, res, next);
}

function logout(req, res) {
  req.logout(() => {
    res.sendStatus(200);
  });
}

function getProfile(req, res) {
  const { password_hash, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
}

async function getAddresses(req, res) {
  const accountId = req.user.id;

  try {
    const addresses =
      await sql`SELECT * FROM addresses WHERE account_id = ${accountId}`;
    res.status(200).json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

async function createAddress(req, res) {
  const accountId = req.user.id;
  const { body } = req;
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).send('Address data is required');
  }

  try {
    const result =
      await sql`INSERT INTO addresses (account_id, street1, street2, city, zip, country) VALUES (
        ${accountId}, ${body.street1 || null}, ${body.street2 || null},
        ${body.city || null}, ${body.zip || null}, ${body.country || null}
      ) RETURNING id`;
    res.status(201).send({ id: result[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

async function deleteAddress(req, res) {
  const accountId = req.user.id;
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).send('Address ID is required');
  }
  try {
    const result =
      await sql`DELETE FROM addresses WHERE id = ${id} AND account_id = ${accountId}`;
    if (result.count === 0) {
      return res.status(404).send('Address not found');
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

async function cleanupTestAccounts(req, res) {
  try {
    await sql`DELETE FROM accounts WHERE email like '%@abcdefg.com'`;
  } catch (error) {
    console.error('Error cleaning up test accounts:', error);
    return res.status(500).send('Internal Server Error');
  }

  res.sendStatus(200);
}

async function createAdminAccount(email, password_hash) {
  try {
    const result =
      await sql`INSERT INTO accounts (email, password_hash, is_admin) VALUES (${email}, ${password_hash}, true) RETURNING id`;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createAccount,
  login,
  logout,
  getProfile,
  getAddresses,
  createAddress,
  deleteAddress,
  cleanupTestAccounts,
  createAdminAccount,
};
