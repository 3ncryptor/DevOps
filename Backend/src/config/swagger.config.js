import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce Platform API",
      version: "1.0.0",
      description: `
## Overview
RESTful API for the E-Commerce Platform supporting multi-vendor marketplace functionality.

## Authentication
This API uses JWT Bearer tokens for authentication.
- **Access Token**: Short-lived token (15 minutes) sent in Authorization header
- **Refresh Token**: Long-lived token (7 days) stored in httpOnly cookie

## Rate Limiting
- Standard endpoints: 100 requests per minute
- Auth endpoints: 10 requests per minute

## Response Format
All responses follow a standardized format:
\`\`\`json
{
  "statusCode": 200,
  "data": {},
  "message": "Success message",
  "success": true
}
\`\`\`
      `,
      contact: {
        name: "API Support",
        email: "support@example.com"
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC"
      }
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server"
      },
      {
        url: "https://api.example.com",
        description: "Production server"
      }
    ],
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication & authorization" },
      { name: "Users", description: "User profile management" },
      { name: "Sellers", description: "Seller registration & management" },
      { name: "Stores", description: "Store management" },
      { name: "Products", description: "Product catalog management" },
      { name: "Cart", description: "Shopping cart operations" },
      { name: "Orders", description: "Order management" },
      { name: "Payments", description: "Payment processing" },
      { name: "Admin", description: "Admin operations" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token"
        }
      },
      schemas: {
        // Standard Response
        ApiResponse: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 200 },
            data: { type: "object", nullable: true },
            message: { type: "string", example: "Success" },
            success: { type: "boolean", example: true }
          }
        },
        ApiError: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 400 },
            message: { type: "string", example: "Validation failed" },
            success: { type: "boolean", example: false },
            data: { type: "object", nullable: true },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" }
                }
              }
            }
          }
        },

        // Auth Schemas
        RegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "Password123",
              description: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            password: {
              type: "string",
              format: "password",
              example: "Password123"
            }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
          }
        },

        // User Schemas
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            email: { type: "string", example: "user@example.com" },
            role: {
              type: "string",
              enum: ["USER", "SELLER", "SUPER_ADMIN"],
              example: "USER"
            },
            accountStatus: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED", "DELETED"],
              example: "ACTIVE"
            },
            emailVerified: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        UserProfile: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            personal: {
              type: "object",
              properties: {
                firstName: { type: "string", example: "John" },
                lastName: { type: "string", example: "Doe" },
                dateOfBirth: { type: "string", format: "date" },
                gender: {
                  type: "string",
                  enum: ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]
                },
                profileImageUrl: { type: "string", format: "uri" }
              }
            },
            contact: {
              type: "object",
              properties: {
                primaryPhone: { type: "string" },
                secondaryPhone: { type: "string" }
              }
            },
            preferences: {
              type: "object",
              properties: {
                language: { type: "string", example: "en" },
                currency: { type: "string", example: "USD" },
                marketingOptIn: { type: "boolean" }
              }
            }
          }
        },

        // Address Schema
        Address: {
          type: "object",
          properties: {
            _id: { type: "string" },
            label: { type: "string", enum: ["HOME", "WORK", "OTHER"] },
            type: { type: "string", enum: ["SHIPPING", "BILLING"] },
            recipient: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                phoneNumber: { type: "string" }
              }
            },
            addressLine1: { type: "string" },
            addressLine2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" },
            isDefault: { type: "boolean" }
          }
        },

        // Seller Schemas
        Seller: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            business: {
              type: "object",
              properties: {
                legalName: { type: "string" },
                displayName: { type: "string" },
                businessType: {
                  type: "string",
                  enum: ["INDIVIDUAL", "SOLE_PROPRIETOR", "COMPANY"]
                },
                taxIdentifier: { type: "string" }
              }
            },
            contact: {
              type: "object",
              properties: {
                email: { type: "string" },
                phone: { type: "string" }
              }
            },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]
            }
          }
        },

        // Store Schemas
        Store: {
          type: "object",
          properties: {
            _id: { type: "string" },
            sellerId: { type: "string" },
            storeIdentity: {
              type: "object",
              properties: {
                name: { type: "string", example: "Tech Store" },
                slug: { type: "string", example: "tech-store" }
              }
            },
            description: { type: "string" },
            branding: {
              type: "object",
              properties: {
                logoUrl: { type: "string", format: "uri" },
                bannerUrl: { type: "string", format: "uri" }
              }
            },
            storeStatus: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED", "CLOSED"]
            }
          }
        },

        // Product Schemas
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            storeId: { type: "string" },
            categoryId: { type: "string" },
            identity: {
              type: "object",
              properties: {
                title: { type: "string", example: "Wireless Headphones" },
                subtitle: { type: "string" },
                description: { type: "string" }
              }
            },
            attributes: {
              type: "object",
              properties: {
                brand: { type: "string" },
                sku: { type: "string" },
                weight: { type: "number" },
                dimensions: {
                  type: "object",
                  properties: {
                    length: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" }
                  }
                }
              }
            },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ARCHIVED"]
            }
          }
        },

        // Cart Schemas
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  storeId: { type: "string" },
                  quantity: { type: "integer", minimum: 1 },
                  addedAt: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        CartItemRequest: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", minimum: 1, example: 1 }
          }
        },

        // Order Schemas
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            storeId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  titleSnapshot: { type: "string" },
                  priceSnapshot: { type: "number" },
                  quantity: { type: "integer" }
                }
              }
            },
            pricing: {
              type: "object",
              properties: {
                subtotal: { type: "number" },
                tax: { type: "number" },
                shippingFee: { type: "number" },
                totalAmount: { type: "number" }
              }
            },
            status: {
              type: "string",
              enum: ["CREATED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
            }
          }
        },

        // Payment Schemas
        Payment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderId: { type: "string" },
            userId: { type: "string" },
            provider: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            status: {
              type: "string",
              enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"]
            },
            transactionReference: { type: "string" }
          }
        },

        // Category Schema
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            parentCategoryId: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            sortOrder: { type: "integer" }
          }
        },

        // Pagination
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            totalPages: { type: "integer", example: 5 },
            totalDocs: { type: "integer", example: 50 },
            hasNextPage: { type: "boolean" },
            hasPrevPage: { type: "boolean" }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
              example: {
                statusCode: 401,
                message: "Authorization token missing",
                success: false,
                data: null
              }
            }
          }
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
              example: {
                statusCode: 403,
                message: "Access denied",
                success: false,
                data: null
              }
            }
          }
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
              example: {
                statusCode: 404,
                message: "Resource not found",
                success: false,
                data: null
              }
            }
          }
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
              example: {
                statusCode: 400,
                message: "Validation failed",
                success: false,
                data: null,
                errors: [
                  { field: "email", message: "Valid email is required" }
                ]
              }
            }
          }
        }
      }
    }
  },
  apis: [
    "./src/routes/**/*.js",
    "./src/docs/swagger/*.js"
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
