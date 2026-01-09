const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { getCart, addOrUpdateItem, clearCart } = require('../controllers/cart');

const router = Router();

router.get('/', requireAuth, getCart);
router.post('/', requireAuth, addOrUpdateItem);
router.delete('/', requireAuth, clearCart);

module.exports = router;
