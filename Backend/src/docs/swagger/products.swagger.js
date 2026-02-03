/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     description: Get paginated list of published products with filtering and sorting
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Category ID to filter by
 *       - name: store
 *         in: query
 *         schema:
 *           type: string
 *         description: Store ID to filter by
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, price, title]
 *           default: createdAt
 *         description: Field to sort by
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                         products:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Product'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *
 *   post:
 *     tags: [Products]
 *     summary: Create product
 *     description: Create a new product (Seller only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - categoryId
 *               - price
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Wireless Bluetooth Headphones"
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *                 example: "High-quality wireless headphones with noise cancellation"
 *               categoryId:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 99.99
 *               brand:
 *                 type: string
 *               sku:
 *                 type: string
 *               weight:
 *                 type: number
 *               stock:
 *                 type: integer
 *                 example: 100
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Main product image (required)
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (max 10)
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/v1/products/{productId}:
 *   get:
 *     tags: [Products]
 *     summary: Get product details
 *     description: Get detailed information about a specific product
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Product'
 *                         - type: object
 *                           properties:
 *                             images:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   url:
 *                                     type: string
 *                                   altText:
 *                                     type: string
 *                             price:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                 currency:
 *                                   type: string
 *                             inventory:
 *                               type: object
 *                               properties:
 *                                 inStock:
 *                                   type: boolean
 *                                 available:
 *                                   type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   patch:
 *     tags: [Products]
 *     summary: Update product
 *     description: Update product details (Seller only, own products)
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
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *               brand:
 *                 type: string
 *               sku:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     description: Delete a product (Seller only, own products)
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
 *         description: Product deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/products/{productId}/images:
 *   post:
 *     tags: [Products]
 *     summary: Add product images
 *     description: Upload additional images to a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images to add (max 10)
 *     responses:
 *       200:
 *         description: Images added successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   delete:
 *     tags: [Products]
 *     summary: Delete product image
 *     description: Remove an image from a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: imageId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
