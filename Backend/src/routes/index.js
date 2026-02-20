import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import userRoutes from './v1/user.routes.js';
import sellerRoutes from './v1/seller.routes.js';
import storeRoutes from './v1/store.routes.js';
import productRoutes from './v1/product.routes.js';
import cartRoutes from './v1/cart.routes.js';
import orderRoutes from './v1/order.routes.js';
import paymentRoutes from './v1/payment.routes.js';
import adminRoutes from './v1/admin.routes.js';

const router = Router();

// API v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/sellers', sellerRoutes);
router.use('/v1/stores', storeRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/cart', cartRoutes);
router.use('/v1/orders', orderRoutes);
router.use('/v1/payments', paymentRoutes);
router.use('/v1/admin', adminRoutes);

export default router;
