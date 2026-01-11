const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { createOrder, getOrders } = require('../controllers/orders');

const router = Router();

router.get('/', requireAuth, getOrders);
router.post('/', requireAuth, createOrder);

module.exports = router;
