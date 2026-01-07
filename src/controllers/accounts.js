const sql = require('../config/db');
const { hash } = require('../utils/authHelper');
const passport = require('passport');

async function createAccount(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const hashedPassword = await hash(password);

    await sql`INSERT INTO accounts (email, password_hash) VALUES (${email}, ${hashedPassword})`;
    res.status(201).send('Account created successfully');
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

module.exports = {
  createAccount,
  login,
  logout,
  getProfile,
  cleanupTestAccounts,
};
