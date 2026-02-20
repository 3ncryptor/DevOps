/**
 * Order status lifecycle
 * Transitions are strictly controlled in order service
 */
export const ORDER_STATUS = {
    CREATED: 'CREATED', // Order created, awaiting payment
    PAID: 'PAID', // Payment confirmed
    PROCESSING: 'PROCESSING', // Seller is preparing order
    SHIPPED: 'SHIPPED', // Order shipped, in transit
    DELIVERED: 'DELIVERED', // Order delivered to customer
    CANCELLED: 'CANCELLED', // Order cancelled (before shipment)
    REFUNDED: 'REFUNDED', // Order refunded (after payment)
};

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

/**
 * Valid status transitions
 * Key: Current status
 * Value: Array of valid next statuses
 */
export const ORDER_STATUS_TRANSITIONS = {
    [ORDER_STATUS.CREATED]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PAID]: [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.REFUNDED,
    ],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.REFUNDED]: [],
};

/**
 * Statuses that allow cancellation
 */
export const CANCELLABLE_STATUSES = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.PAID,
    ORDER_STATUS.PROCESSING,
];

/**
 * Statuses that are considered "completed"
 */
export const COMPLETED_STATUSES = [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
];

export default ORDER_STATUS;
