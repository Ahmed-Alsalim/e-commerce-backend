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
      await sql`INSERT INTO accounts (email, password_hash, name, address) VALUES (${email}, ${hashedPassword}, ${
        body.name || null
      }, ${body.address || null}) RETURNING id`;
    res.status(201).send({ id: result[0].id });
  } catch (error) {
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
  cleanupTestAccounts,
  createAdminAccount,
};
