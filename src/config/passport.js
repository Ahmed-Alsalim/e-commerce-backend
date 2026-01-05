const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { verify } = require('../utils/authHelper');
const sql = require('./db');

const customFields = {
  usernameField: 'email',
  passwordField: 'password',
};

const verifyCallback = async (email, password, done) => {
  try {
    const rows = await sql`SELECT * FROM accounts WHERE email = ${email}`;

    if (!rows || rows.length === 0) {
      return done(null, false, { message: 'Email not found' });
    }

    const user = rows[0];

    const isValid = await verify(password, user.password_hash);

    if (isValid) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Incorrect password' });
    }
  } catch (error) {
    return done(error);
  }
};

const strategy = new LocalStrategy(customFields, verifyCallback);
passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const rows = await sql`SELECT * FROM accounts WHERE id = ${id}`;
    if (!rows || rows.length === 0) {
      return done(new Error('User not found'), null);
    }

    const user = rows[0];
    done(null, user);
  } catch (error) {
    done(error);
  }
});
