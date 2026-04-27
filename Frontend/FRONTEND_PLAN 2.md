# Frontend Execution Plan - Zentra

## 1. Objective
Build a production-ready frontend for Zentra that is:
- Contract-aligned with backend APIs
- Secure and resilient for auth/session management
- Complete for buyer and seller core workflows
- Testable and maintainable

## 2. Current State Snapshot
- Frontend app is running with a minimal route surface (home, login, register).
- Backend already exposes rich commerce APIs (auth, products, stores, cart, orders, payments, admin).
- Highest immediate risk is frontend-backend contract mismatch and incomplete route coverage.
- Frontend quality pipeline (tests and CI checks) is not yet mature.

## 3. Guiding Principles
- API-first: frontend types and behavior must follow real backend responses.
- Thin pages, strong domain services: keep logic in API/services and hooks.
- Role-aware UX: distinct buyer/seller/admin experiences.
- Secure by default: token handling, session lifecycle, and logout correctness.
- Incremental delivery: ship usable vertical slices with tests.

## 4. Phased Roadmap

### Phase 1 - Contract and Routing Stabilization (Highest Priority)
Purpose: eliminate breakages and establish a safe foundation.

Tasks:
1. Freeze and validate API contracts from backend responses.
2. Align frontend types for auth, user, product, store, and pagination envelopes.
3. Reconcile product data mapping with backend model shape:
   - Product identity fields and images/price structures
   - Store identity naming differences
4. Ensure all existing navigation links resolve to real pages.
5. Add route stubs for currently referenced paths:
   - /dashboard
   - /cart
   - /products/[productId]
6. Introduce shared API error parser utility for Axios errors.
7. Remove route dead-ends and fallback copy that assumes missing backend behavior.

Deliverables:
- No 404 navigation from existing UI controls.
- Type-safe API contracts for current pages.
- Product list and product card rendering from real backend response shape.

Acceptance Criteria:
- Frontend builds with no type errors.
- Home, login, register, cart, dashboard, product detail routes all resolve.
- API layer has zero any-based response assumptions for implemented flows.

---

### Phase 2 - Auth and Session Lifecycle Completion
Purpose: make authentication reliable, secure, and user-friendly.

Tasks:
1. Expand auth API service methods:
   - me
   - logout
   - logout-all
   - refresh compatibility checks
2. Implement app bootstrap session check (restore session on reload).
3. Add route guards:
   - Public-only guard for login/register when authenticated
   - Protected guard for buyer/seller dashboard routes
4. Add robust token refresh handling:
   - Single-flight refresh lock (prevent refresh storms)
   - Retry queued requests after successful refresh
5. Align logout UX with backend token invalidation endpoints and cookie clearing behavior.
6. Add standardized unauthorized and forbidden UI states.

Deliverables:
- Predictable login/logout/session refresh behavior.
- Protected pages inaccessible without valid auth.

Acceptance Criteria:
- Authenticated reload keeps user signed in when session is valid.
- Expired session redirects cleanly to login.
- Logout invalidates both frontend auth state and backend refresh capability.

---

### Phase 3 - Buyer Core Marketplace Flow
Purpose: deliver complete buyer journey from discovery to cart readiness.

Tasks:
1. Upgrade product listing page:
   - Server-backed filters (search, category, price range, store)
   - Sorting and pagination controls
2. Build product detail page:
   - Gallery, description, brand/store info, current price, stock signal
3. Implement cart API integration:
   - Add to cart
   - Update quantity
   - Remove item
   - Empty cart
4. Build cart page with summary and clear error/loading states.
5. Add empty states and retry actions across all buyer views.

Deliverables:
- Functional listing -> detail -> cart flow.

Acceptance Criteria:
- Buyer can browse, filter, inspect, and manage cart items without manual refresh hacks.
- All core actions show deterministic loading and error states.

---

### Phase 4 - Seller Core Operations
Purpose: enable sellers to manage catalog and stock.

Tasks:
1. Create seller dashboard shell with role-gated navigation.
2. Implement my products table/grid for seller-owned products.
3. Build create product flow:
   - Identity, category, price, stock, image handling
4. Build edit/update flow and status actions:
   - Publish, archive, soft-delete behavior
5. Add inventory views:
   - Inventory list
   - Low-stock list
   - Inventory update actions
6. Add price history view for product-level pricing timeline.

Deliverables:
- End-to-end seller product management MVP.

Acceptance Criteria:
- Approved seller can create, publish, archive, and update products.
- Seller inventory pages accurately reflect backend state.

---

### Phase 5 - Frontend Quality, Testing, and CI
Purpose: prevent regressions and improve release confidence.

Tasks:
1. Add frontend scripts (if missing):
   - lint
   - typecheck
   - test
   - test:e2e (optional milestone)
2. Unit tests:
   - API utilities
   - auth store behavior
   - shared components
3. Integration tests:
   - Auth forms
   - Product listing data flow
   - Cart interactions
4. E2E smoke tests:
   - Register/login
   - Browse products
   - Add/remove cart item
5. Wire CI checks to block merge on failing lint/type/test.

Deliverables:
- Baseline frontend test suite and CI guardrails.

Acceptance Criteria:
- Pull requests fail on regressions.
- Core user flows have automated test coverage.

---

### Phase 6 - Documentation and Developer Experience
Purpose: reduce onboarding friction and improve long-term maintainability.

Tasks:
1. Add/refresh frontend README:
   - setup
   - environment variables
   - run/build/test commands
   - route map
2. Add API contract docs generated from backend examples or OpenAPI source.
3. Document role matrix and route access policy.
4. Add conventions doc for:
   - naming
   - component boundaries
   - error handling
   - state ownership

Deliverables:
- Clear, versioned frontend development documentation.

Acceptance Criteria:
- New contributor can run and extend frontend without tribal knowledge.

## 5. Suggested Implementation Order
1. Phase 1 + Phase 2 (stability and auth correctness)
2. Phase 3 (buyer flow)
3. Phase 4 (seller flow)
4. Phase 5 and Phase 6 in parallel (quality + docs)

## 6. Milestone Timeline (Recommended)
- Milestone A (Week 1): Phase 1 complete
- Milestone B (Week 2): Phase 2 complete
- Milestone C (Week 3): Phase 3 complete
- Milestone D (Weeks 4-5): Phase 4 complete
- Milestone E (Week 6): Phase 5 + Phase 6 baseline complete

## 7. Risks and Mitigations
1. API contract drift
- Mitigation: central typed API client + response schema guards for critical paths.

2. Auth edge-case regressions
- Mitigation: dedicated auth integration tests and refresh-lock implementation.

3. Frontend route sprawl
- Mitigation: route ownership table and role-based nav configuration.

4. Slow delivery due to rework
- Mitigation: ship by vertical slices with acceptance criteria per phase.

## 8. Definition of Done (Frontend MVP)
Frontend is considered MVP-ready when:
1. Auth lifecycle is stable (login, refresh, logout, guards).
2. Buyer can browse products and manage cart.
3. Seller can manage product lifecycle and inventory.
4. Core flows are covered by automated tests.
5. Build, lint, and typecheck pass in CI consistently.
