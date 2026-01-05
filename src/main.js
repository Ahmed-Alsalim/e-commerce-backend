const accountsRouter = require('./routes/accounts');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const sql = require('./config/db');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

app.use('/accounts', accountsRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

module.exports = app;
