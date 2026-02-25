const cors = require('cors');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const accountsRouter = require('./routes/accounts');
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payment');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

app.use('/accounts', accountsRouter);
app.use('/products', productsRouter);
app.use('/cart', cartsRouter);
app.use('/orders', ordersRouter);
app.use('/payment/stripe', paymentRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
}

module.exports = app;
