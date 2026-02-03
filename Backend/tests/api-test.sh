#!/bin/bash

# ============================================================
# ZENTRA API COMPREHENSIVE TEST SCRIPT
# Tests all routes and user workflows
# ============================================================

BASE_URL="http://localhost:8000"
API_URL="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Store tokens and IDs for workflow tests
USER_TOKEN=""
USER_REFRESH_TOKEN=""
USER_ID=""
SELLER_TOKEN=""
SELLER_ID=""
STORE_ID=""
PRODUCT_ID=""
CART_ITEM_ID=""
ORDER_ID=""
PAYMENT_ID=""
ADMIN_TOKEN=""
CATEGORY_ID=""
ADDRESS_ID=""

# Unique identifiers for this test run
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser_${TIMESTAMP}@example.com"
SELLER_EMAIL="testseller_${TIMESTAMP}@example.com"
ADMIN_EMAIL="admin_${TIMESTAMP}@example.com"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED++))
    ((TOTAL++))
}

print_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Response: $2${NC}"
    ((FAILED++))
    ((TOTAL++))
}

# Make API request and check status
api_test() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local expected_status=$5
    local test_name=$6
    
    print_test "$test_name"
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi
    
    local response
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" 2>/dev/null)
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        print_pass "$test_name (HTTP $http_code)"
        echo "$body"
    else
        print_fail "$test_name (Expected $expected_status, got $http_code)" "$body"
    fi
    
    echo "$body"
}

# ============================================================
# TEST EXECUTION
# ============================================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ZENTRA API COMPREHENSIVE TEST SUITE               ║${NC}"
echo -e "${GREEN}║         Testing all routes and workflows                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# 1. HEALTH & ROOT ENDPOINTS
# ============================================================
print_header "1. HEALTH & ROOT ENDPOINTS"

print_test "GET / - API Info"
RESPONSE=$(curl -s "$BASE_URL/")
echo "$RESPONSE" | grep -q "Zentra" && print_pass "Root endpoint" || print_fail "Root endpoint" "$RESPONSE"

print_test "GET /health - Health Check"
RESPONSE=$(curl -s "$BASE_URL/health")
echo "$RESPONSE" | grep -q "healthy" && print_pass "Health check" || print_fail "Health check" "$RESPONSE"

print_test "GET /api-docs - Swagger Docs"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api-docs")
[ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "301" ] && print_pass "Swagger docs accessible" || print_fail "Swagger docs" "$RESPONSE"

# ============================================================
# 2. AUTH ROUTES - USER REGISTRATION & LOGIN
# ============================================================
print_header "2. AUTH ROUTES - USER REGISTRATION & LOGIN"

print_test "POST /auth/register - Register new user"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"Test@12345\", \"role\": \"USER\"}")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "accessToken\|success" && print_pass "User registration" || print_fail "User registration" "$RESPONSE"
USER_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "User Token: ${USER_TOKEN:0:50}..."
echo "User ID: $USER_ID"

print_test "POST /auth/register - Duplicate email (should fail)"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"Test@12345\", \"role\": \"USER\"}")
echo "$RESPONSE" | grep -q "409\|already\|exists\|duplicate" && print_pass "Duplicate email rejected" || print_fail "Duplicate email check" "$RESPONSE"

print_test "POST /auth/login - Login with correct credentials"
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"Test@12345\"}")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "accessToken" && print_pass "User login" || print_fail "User login" "$RESPONSE"
USER_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

print_test "POST /auth/login - Wrong password (should fail)"
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"WrongPassword\"}")
echo "$RESPONSE" | grep -q "401\|Invalid\|incorrect" && print_pass "Wrong password rejected" || print_fail "Wrong password check" "$RESPONSE"

print_test "GET /auth/me - Get current user"
RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "$TEST_EMAIL" && print_pass "Get current user" || print_fail "Get current user" "$RESPONSE"

# ============================================================
# 3. USER ROUTES - PROFILE & ADDRESSES
# ============================================================
print_header "3. USER ROUTES - PROFILE & ADDRESSES"

print_test "GET /users/me - Get my profile"
RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|email" && print_pass "Get profile" || print_fail "Get profile" "$RESPONSE"

print_test "PUT /users/me - Update profile"
RESPONSE=$(curl -s -X PUT "$API_URL/users/me" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"firstName": "Test", "lastName": "User", "phone": "+1234567890"}')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|Test" && print_pass "Update profile" || print_fail "Update profile" "$RESPONSE"

print_test "POST /users/addresses - Add address"
RESPONSE=$(curl -s -X POST "$API_URL/users/addresses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{
        "label": "Home",
        "fullName": "Test User",
        "phoneNumber": "+1234567890",
        "addressLine1": "123 Test Street",
        "city": "Test City",
        "state": "Test State",
        "postalCode": "12345",
        "country": "USA",
        "isDefault": true
    }')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|_id" && print_pass "Add address" || print_fail "Add address" "$RESPONSE"
ADDRESS_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Address ID: $ADDRESS_ID"

print_test "GET /users/addresses - Get addresses"
RESPONSE=$(curl -s -X GET "$API_URL/users/addresses" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|addresses\|Test" && print_pass "Get addresses" || print_fail "Get addresses" "$RESPONSE"

# ============================================================
# 4. SELLER REGISTRATION & ONBOARDING
# ============================================================
print_header "4. SELLER REGISTRATION & ONBOARDING"

print_test "POST /auth/register - Register seller"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$SELLER_EMAIL\", \"password\": \"Seller@12345\", \"role\": \"SELLER\"}")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "accessToken\|success" && print_pass "Seller registration" || print_fail "Seller registration" "$RESPONSE"
SELLER_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Seller Token: ${SELLER_TOKEN:0:50}..."

print_test "POST /sellers/register - Complete seller profile"
RESPONSE=$(curl -s -X POST "$API_URL/sellers/register" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -d '{
        "businessName": "Test Store Business",
        "businessType": "INDIVIDUAL",
        "taxId": "TAX123456",
        "businessAddress": {
            "addressLine1": "456 Business Ave",
            "city": "Commerce City",
            "state": "CA",
            "postalCode": "90210",
            "country": "USA"
        },
        "bankDetails": {
            "accountName": "Test Seller",
            "accountNumber": "1234567890",
            "bankName": "Test Bank",
            "routingNumber": "987654321"
        }
    }')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|seller\|pending\|_id" && print_pass "Seller profile creation" || print_fail "Seller profile creation" "$RESPONSE"
SELLER_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Seller ID: $SELLER_ID"

print_test "GET /sellers/me - Get seller profile"
RESPONSE=$(curl -s -X GET "$API_URL/sellers/me" \
    -H "Authorization: Bearer $SELLER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|seller\|business" && print_pass "Get seller profile" || print_fail "Get seller profile" "$RESPONSE"

# ============================================================
# 5. ADMIN ROUTES (Create admin and approve seller)
# ============================================================
print_header "5. ADMIN ROUTES"

print_test "POST /auth/register - Register admin"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"Admin@12345\", \"role\": \"SUPER_ADMIN\"}")
echo "$RESPONSE"
ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Admin Token: ${ADMIN_TOKEN:0:50}..."
[ -n "$ADMIN_TOKEN" ] && print_pass "Admin registration" || print_fail "Admin registration" "$RESPONSE"

print_test "GET /admin/dashboard - Admin dashboard"
RESPONSE=$(curl -s -X GET "$API_URL/admin/dashboard" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|overview\|dashboard" && print_pass "Admin dashboard" || print_fail "Admin dashboard" "$RESPONSE"

print_test "GET /admin/sellers/pending - Get pending sellers"
RESPONSE=$(curl -s -X GET "$API_URL/admin/sellers/pending" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|sellers" && print_pass "Get pending sellers" || print_fail "Get pending sellers" "$RESPONSE"

# Approve the seller
if [ -n "$SELLER_ID" ]; then
    print_test "POST /admin/sellers/:id/approve - Approve seller"
    RESPONSE=$(curl -s -X POST "$API_URL/admin/sellers/$SELLER_ID/approve" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|approved\|Approved" && print_pass "Approve seller" || print_fail "Approve seller" "$RESPONSE"
fi

# Create a category
print_test "POST /admin/categories - Create category"
RESPONSE=$(curl -s -X POST "$API_URL/admin/categories" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name": "Electronics", "description": "Electronic devices and accessories", "slug": "electronics"}')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|_id\|Electronics" && print_pass "Create category" || print_fail "Create category" "$RESPONSE"
CATEGORY_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Category ID: $CATEGORY_ID"

print_test "GET /admin/categories - Get categories"
RESPONSE=$(curl -s -X GET "$API_URL/admin/categories" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|categories\|Electronics" && print_pass "Get categories" || print_fail "Get categories" "$RESPONSE"
# Get category ID if not set
if [ -z "$CATEGORY_ID" ]; then
    CATEGORY_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

# ============================================================
# 6. STORE ROUTES
# ============================================================
print_header "6. STORE ROUTES"

# Re-login seller to get fresh token
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$SELLER_EMAIL\", \"password\": \"Seller@12345\"}")
SELLER_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

print_test "POST /stores - Create store"
RESPONSE=$(curl -s -X POST "$API_URL/stores" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -d '{
        "name": "Test Electronics Store",
        "description": "The best electronics store for testing",
        "slug": "test-electronics-'$TIMESTAMP'"
    }')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|_id\|store" && print_pass "Create store" || print_fail "Create store" "$RESPONSE"
STORE_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Store ID: $STORE_ID"

print_test "GET /stores/:id - Get store by ID"
RESPONSE=$(curl -s -X GET "$API_URL/stores/$STORE_ID")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|store\|Test" && print_pass "Get store by ID" || print_fail "Get store by ID" "$RESPONSE"

print_test "GET /stores/my-store - Get my store"
RESPONSE=$(curl -s -X GET "$API_URL/stores/my-store" \
    -H "Authorization: Bearer $SELLER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|store" && print_pass "Get my store" || print_fail "Get my store" "$RESPONSE"

print_test "PUT /stores/:id - Update store"
RESPONSE=$(curl -s -X PUT "$API_URL/stores/$STORE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -d '{"description": "Updated store description for testing"}')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|Updated" && print_pass "Update store" || print_fail "Update store" "$RESPONSE"

# ============================================================
# 7. PRODUCT ROUTES
# ============================================================
print_header "7. PRODUCT ROUTES"

print_test "POST /products - Create product"
RESPONSE=$(curl -s -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -d "{
        \"storeId\": \"$STORE_ID\",
        \"categoryId\": \"$CATEGORY_ID\",
        \"title\": \"Test Smartphone\",
        \"description\": \"A great smartphone for testing purposes\",
        \"price\": 599.99,
        \"sku\": \"TEST-PHONE-001\",
        \"quantity\": 100
    }")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|_id\|product" && print_pass "Create product" || print_fail "Create product" "$RESPONSE"
PRODUCT_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Product ID: $PRODUCT_ID"

print_test "GET /products - List all products"
RESPONSE=$(curl -s -X GET "$API_URL/products")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|products" && print_pass "List products" || print_fail "List products" "$RESPONSE"

print_test "GET /products/:id - Get product by ID"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -X GET "$API_URL/products/$PRODUCT_ID")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|product\|Smartphone" && print_pass "Get product by ID" || print_fail "Get product by ID" "$RESPONSE"
else
    print_fail "Get product by ID" "No product ID available"
fi

print_test "GET /products/my-products - Get seller products"
RESPONSE=$(curl -s -X GET "$API_URL/products/my-products" \
    -H "Authorization: Bearer $SELLER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|products" && print_pass "Get seller products" || print_fail "Get seller products" "$RESPONSE"

print_test "PUT /products/:id - Update product"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/products/my-products/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SELLER_TOKEN" \
        -d '{"description": "Updated product description"}')
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|product\|Updated" && print_pass "Update product" || print_fail "Update product" "$RESPONSE"
fi

print_test "POST /products/:id/publish - Publish product"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/products/my-products/$PRODUCT_ID/publish" \
        -H "Authorization: Bearer $SELLER_TOKEN")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|PUBLISHED\|published" && print_pass "Publish product" || print_fail "Publish product" "$RESPONSE"
fi

# ============================================================
# 8. CART ROUTES
# ============================================================
print_header "8. CART ROUTES"

print_test "GET /cart - Get empty cart"
RESPONSE=$(curl -s -X GET "$API_URL/cart" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|cart" && print_pass "Get cart" || print_fail "Get cart" "$RESPONSE"

print_test "POST /cart/items - Add item to cart"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/cart/items" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{\"productId\": \"$PRODUCT_ID\", \"quantity\": 2}")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|cart\|items" && print_pass "Add to cart" || print_fail "Add to cart" "$RESPONSE"
fi

print_test "GET /cart - Get cart with items"
RESPONSE=$(curl -s -X GET "$API_URL/cart" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|cart\|items" && print_pass "Get cart with items" || print_fail "Get cart with items" "$RESPONSE"

print_test "PUT /cart/items/:productId - Update cart item quantity"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/cart/items/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{"quantity": 3}')
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|cart" && print_pass "Update cart item" || print_fail "Update cart item" "$RESPONSE"
fi

# ============================================================
# 9. ORDER ROUTES
# ============================================================
print_header "9. ORDER ROUTES"

print_test "POST /orders - Create order from cart"
RESPONSE=$(curl -s -X POST "$API_URL/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d "{
        \"shippingAddressId\": \"$ADDRESS_ID\",
        \"billingAddressId\": \"$ADDRESS_ID\"
    }")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|order\|_id" && print_pass "Create order" || print_fail "Create order" "$RESPONSE"
ORDER_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Order ID: $ORDER_ID"

print_test "GET /orders/my-orders - Get my orders"
RESPONSE=$(curl -s -X GET "$API_URL/orders/my-orders" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|orders" && print_pass "Get my orders" || print_fail "Get my orders" "$RESPONSE"

print_test "GET /orders/:id - Get order by ID"
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X GET "$API_URL/orders/$ORDER_ID" \
        -H "Authorization: Bearer $USER_TOKEN")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|order" && print_pass "Get order by ID" || print_fail "Get order by ID" "$RESPONSE"
fi

# ============================================================
# 10. PAYMENT ROUTES
# ============================================================
print_header "10. PAYMENT ROUTES"

print_test "POST /payments/initiate - Initiate payment"
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/payments/initiate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{\"orderId\": \"$ORDER_ID\", \"provider\": \"mock\"}")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|payment\|_id" && print_pass "Initiate payment" || print_fail "Initiate payment" "$RESPONSE"
    PAYMENT_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Payment ID: $PAYMENT_ID"
fi

print_test "POST /payments/:id/process - Process payment"
if [ -n "$PAYMENT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/payments/$PAYMENT_ID/process" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{"cardNumber": "4111111111111111", "expiryMonth": "12", "expiryYear": "2027", "cvv": "123"}')
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|SUCCESS\|payment" && print_pass "Process payment" || print_fail "Process payment" "$RESPONSE"
fi

print_test "GET /payments/my-payments - Get my payments"
RESPONSE=$(curl -s -X GET "$API_URL/payments/my-payments" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|payments" && print_pass "Get my payments" || print_fail "Get my payments" "$RESPONSE"

# ============================================================
# 11. SELLER ORDER MANAGEMENT
# ============================================================
print_header "11. SELLER ORDER MANAGEMENT"

print_test "GET /orders/store/:storeId - Get store orders"
if [ -n "$STORE_ID" ]; then
    RESPONSE=$(curl -s -X GET "$API_URL/orders/store/$STORE_ID" \
        -H "Authorization: Bearer $SELLER_TOKEN")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|orders" && print_pass "Get store orders" || print_fail "Get store orders" "$RESPONSE"
fi

print_test "POST /orders/:id/process - Process order"
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/orders/$ORDER_ID/process" \
        -H "Authorization: Bearer $SELLER_TOKEN")
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|PROCESSING" && print_pass "Process order" || print_fail "Process order" "$RESPONSE"
fi

print_test "POST /orders/:id/ship - Ship order"
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/orders/$ORDER_ID/ship" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SELLER_TOKEN" \
        -d '{"trackingNumber": "TRACK123456", "carrier": "FedEx"}')
    echo "$RESPONSE"
    echo "$RESPONSE" | grep -q "success\|SHIPPED" && print_pass "Ship order" || print_fail "Ship order" "$RESPONSE"
fi

# ============================================================
# 12. ADMIN MANAGEMENT ROUTES
# ============================================================
print_header "12. ADMIN MANAGEMENT ROUTES"

print_test "GET /admin/users - Get all users"
RESPONSE=$(curl -s -X GET "$API_URL/admin/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|users" && print_pass "Get all users" || print_fail "Get all users" "$RESPONSE"

print_test "GET /admin/sellers - Get all sellers"
RESPONSE=$(curl -s -X GET "$API_URL/admin/sellers" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|sellers" && print_pass "Get all sellers" || print_fail "Get all sellers" "$RESPONSE"

print_test "GET /admin/stores - Get all stores"
RESPONSE=$(curl -s -X GET "$API_URL/admin/stores" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|stores" && print_pass "Get all stores" || print_fail "Get all stores" "$RESPONSE"

print_test "GET /admin/stats - Get platform stats"
RESPONSE=$(curl -s -X GET "$API_URL/admin/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|stats\|userGrowth" && print_pass "Get platform stats" || print_fail "Get platform stats" "$RESPONSE"

print_test "GET /admin/audit-logs - Get audit logs"
RESPONSE=$(curl -s -X GET "$API_URL/admin/audit-logs" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|logs" && print_pass "Get audit logs" || print_fail "Get audit logs" "$RESPONSE"

# ============================================================
# 13. AUTH TOKEN MANAGEMENT
# ============================================================
print_header "13. AUTH TOKEN MANAGEMENT"

print_test "POST /auth/change-password - Change password"
RESPONSE=$(curl -s -X POST "$API_URL/auth/change-password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"currentPassword": "Test@12345", "newPassword": "NewTest@12345"}')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|changed\|updated" && print_pass "Change password" || print_fail "Change password" "$RESPONSE"

print_test "POST /auth/logout - Logout"
RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "success\|logged out\|Logged" && print_pass "Logout" || print_fail "Logout" "$RESPONSE"

# ============================================================
# 14. ERROR HANDLING TESTS
# ============================================================
print_header "14. ERROR HANDLING TESTS"

print_test "GET /nonexistent - 404 Not Found"
RESPONSE=$(curl -s -X GET "$API_URL/nonexistent")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "404\|not found\|Route" && print_pass "404 error handling" || print_fail "404 error handling" "$RESPONSE"

print_test "GET /products/:id - Invalid ID format"
RESPONSE=$(curl -s -X GET "$API_URL/products/invalid-id-format")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "400\|Invalid\|Cast" && print_pass "Invalid ID handling" || print_fail "Invalid ID handling" "$RESPONSE"

print_test "POST /auth/register - Missing fields"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email": "incomplete@test.com"}')
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "400\|required\|validation" && print_pass "Validation error handling" || print_fail "Validation error handling" "$RESPONSE"

print_test "GET /admin/dashboard - Unauthorized (no token)"
RESPONSE=$(curl -s -X GET "$API_URL/admin/dashboard")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "401\|Unauthorized\|token" && print_pass "Unauthorized handling" || print_fail "Unauthorized handling" "$RESPONSE"

print_test "GET /admin/dashboard - Forbidden (wrong role)"
RESPONSE=$(curl -s -X GET "$API_URL/admin/dashboard" \
    -H "Authorization: Bearer $SELLER_TOKEN")
echo "$RESPONSE"
echo "$RESPONSE" | grep -q "403\|Forbidden\|Access denied" && print_pass "Forbidden handling" || print_fail "Forbidden handling" "$RESPONSE"

# ============================================================
# FINAL SUMMARY
# ============================================================
print_header "TEST SUMMARY"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    TEST RESULTS                           ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Total Tests:  $TOTAL                                       ${NC}"
echo -e "${GREEN}║  Passed:       $PASSED                                       ${NC}"
echo -e "${RED}║  Failed:       $FAILED                                       ${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
