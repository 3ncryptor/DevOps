/**
 * @swagger
 * /api/v1/sellers/register:
 *   post:
 *     tags: [Sellers]
 *     summary: Register as seller
 *     description: Submit seller registration application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business
 *               - contact
 *             properties:
 *               business:
 *                 type: object
 *                 required:
 *                   - legalName
 *                   - displayName
 *                   - businessType
 *                 properties:
 *                   legalName:
 *                     type: string
 *                     example: "Tech Solutions LLC"
 *                   displayName:
 *                     type: string
 *                     example: "TechStore"
 *                   businessType:
 *                     type: string
 *                     enum: [INDIVIDUAL, SOLE_PROPRIETOR, COMPANY]
 *                   taxIdentifier:
 *                     type: string
 *               contact:
 *                 type: object
 *                 required:
 *                   - email
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *     responses:
 *       201:
 *         description: Seller registration submitted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Seller'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Already registered as seller
 */

/**
 * @swagger
 * /api/v1/sellers/profile:
 *   get:
 *     tags: [Sellers]
 *     summary: Get seller profile
 *     description: Get current seller's profile and verification status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Seller'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not registered as seller
 */

/**
 * @swagger
 * /api/v1/sellers/verification/documents:
 *   post:
 *     tags: [Sellers]
 *     summary: Upload verification documents
 *     description: Upload documents for seller verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documentType
 *               - document
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [GOVT_ID, BUSINESS_REGISTRATION, TAX_DOCUMENT, ADDRESS_PROOF, BANK_STATEMENT]
 *               documentNumber:
 *                 type: string
 *                 description: Document ID number
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, JPEG, PNG). Max 10MB.
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid document type or file
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/v1/stores:
 *   post:
 *     tags: [Stores]
 *     summary: Create store
 *     description: Create a new store (Approved sellers only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech Gadgets Store"
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               banner:
 *                 type: string
 *                 format: binary
 *               addressLine1:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Store'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Seller not approved
 */

/**
 * @swagger
 * /api/v1/stores/{storeId}:
 *   get:
 *     tags: [Stores]
 *     summary: Get store details
 *     description: Get public store information
 *     parameters:
 *       - name: storeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID or slug
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Store'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   patch:
 *     tags: [Stores]
 *     summary: Update store
 *     description: Update store details (Store owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storeId
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/stores/{storeId}/branding:
 *   patch:
 *     tags: [Stores]
 *     summary: Update store branding
 *     description: Upload or update store logo and banner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storeId
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
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Store logo (JPEG, PNG, WebP). Max 5MB.
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: Store banner (JPEG, PNG, WebP). Max 5MB.
 *     responses:
 *       200:
 *         description: Branding updated successfully
 *       400:
 *         description: No files provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/v1/stores/{storeId}/products:
 *   get:
 *     tags: [Stores]
 *     summary: Get store products
 *     description: Get paginated list of products from a specific store
 *     parameters:
 *       - name: storeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PUBLISHED]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
