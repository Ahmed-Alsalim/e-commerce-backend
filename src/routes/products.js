const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const {
  createProduct,
  updateProduct,
  listProducts,
  getProductById,
  deleteProduct,
} = require('../controllers/products');

const router = Router();

router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.get('/list', listProducts);
router.get('/:id', getProductById);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

module.exports = router;
