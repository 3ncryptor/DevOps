/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     description: Get paginated list of all users (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [USER, SELLER, SUPER_ADMIN]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, DELETED]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details
 *     description: Get detailed user information including profile and orders (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status
 *     description: Suspend or activate a user account (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED]
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       200:
 *         description: User status updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/admin/sellers:
 *   get:
 *     tags: [Admin]
 *     summary: List all sellers
 *     description: Get paginated list of seller applications (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, SUSPENDED, REJECTED]
 *     responses:
 *       200:
 *         description: Sellers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve seller
 *     description: Approve a pending seller application (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sellerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller approved
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               data:
 *                 status: "APPROVED"
 *                 approvedAt: "2026-02-01T10:00:00.000Z"
 *               message: "Seller approved successfully"
 *               success: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Reject seller
 *     description: Reject a pending seller application (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sellerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Rejection reason
 *     responses:
 *       200:
 *         description: Seller rejected
 *       400:
 *         description: Reason is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}/suspend:
 *   post:
 *     tags: [Admin]
 *     summary: Suspend seller
 *     description: Suspend an active seller (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sellerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Suspension reason
 *     responses:
 *       200:
 *         description: Seller suspended
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     tags: [Admin]
 *     summary: List all categories
 *     description: Get all categories with hierarchy
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *
 *   post:
 *     tags: [Admin]
 *     summary: Create category
 *     description: Create a new product category (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Electronics"
 *               parentCategoryId:
 *                 type: string
 *                 description: Parent category ID for subcategories
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/v1/admin/analytics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform analytics
 *     description: Get overview analytics for the platform (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                         totalUsers:
 *                           type: integer
 *                         totalSellers:
 *                           type: integer
 *                         totalOrders:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                         ordersByStatus:
 *                           type: object
 *                         revenueByDay:
 *                           type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
