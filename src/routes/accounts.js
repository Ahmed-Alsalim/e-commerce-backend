const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const {
  createAccount,
  login,
  logout,
  getProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  cleanupTestAccounts,
} = require('../controllers/accounts');

const router = Router();

router.post('/create', createAccount);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.get('/addresses', requireAuth, getAddresses);
router.post('/addresses', requireAuth, createAddress);
router.put('/addresses/:id', requireAuth, updateAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);
router.delete('/test/cleanup', cleanupTestAccounts);

module.exports = router;
