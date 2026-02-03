/**
 * User roles in the platform
 * - USER: Buyer who purchases products
 * - SELLER: Business operator who runs a store
 * - SUPER_ADMIN: Platform governor with full control (no commerce participation)
 */
export const ROLES = {
  USER: "USER",
  SELLER: "SELLER",
  SUPER_ADMIN: "SUPER_ADMIN"
};

export const ROLE_VALUES = Object.values(ROLES);

/**
 * Role hierarchy for permission checks
 * Higher number = more privileges (for audit purposes only, not escalation)
 */
export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.SELLER]: 2,
  [ROLES.SUPER_ADMIN]: 3
};

export default ROLES;
