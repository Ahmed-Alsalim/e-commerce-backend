const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const {
  addProductImage,
  createProduct,
  deleteProduct,
  deleteProductImage,
  getProductById,
  getProductImages,
  listProducts,
  updateProduct,
} = require('../controllers/products');

const router = Router();

router.get('/:id', getProductById);
router.get('/:id/images', getProductImages);
router.get('/list', listProducts);
router.post('/:id/images', requireAuth, requireAdmin, addProductImage);
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);
router.delete('/:id/images', requireAuth, requireAdmin, deleteProductImage);

module.exports = router;
