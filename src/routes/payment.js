const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { createCheckoutSession, sessionStatus } = require('../controllers/payment');

const router = Router();

router.post('/create-checkout-session', createCheckoutSession);
router.get('/session-status', sessionStatus);

module.exports = router;
