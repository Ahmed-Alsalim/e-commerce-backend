const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const {
  createAccount,
  login,
  logout,
  getProfile,
  cleanupTestAccounts,
} = require('../controllers/accounts');

const router = express.Router();

router.post('/create', createAccount);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.delete('/test/cleanup', cleanupTestAccounts);

module.exports = router;
