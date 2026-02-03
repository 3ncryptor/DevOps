/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user cart
 *     description: Retrieve the authenticated user's shopping cart with product details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productId:
 *                                 $ref: '#/components/schemas/Product'
 *                               quantity:
 *                                 type: integer
 *                               addedAt:
 *                                 type: string
 *                                 format: date-time
 *                         itemCount:
 *                           type: integer
 *                         subtotal:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     description: Remove all items from the cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               data: null
 *               message: "Cart cleared"
 *               success: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     description: Add a product to the shopping cart or update quantity if exists
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemRequest'
 *           example:
 *             productId: "507f1f77bcf86cd799439011"
 *             quantity: 2
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid product or insufficient stock
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/v1/cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     description: Update the quantity of a specific item in the cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Item not found in cart
 *
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     description: Remove a specific item from the cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Item not found in cart
 */
