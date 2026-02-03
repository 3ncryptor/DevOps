/**
 * Analytics Service
 * Provides analytics and reporting for sellers and platform
 */

import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { User } from "../models/users.model.js";
import { Payment } from "../models/payment.model.js";
import { SellerMetricsDaily } from "../models/sellerMetricsDaily.model.js";
import { ORDER_STATUS } from "../constants/orderStatus.js";
import { PAYMENT_STATUS } from "../constants/platform.js";

// ============== SELLER ANALYTICS ==============

/**
 * Get store analytics overview
 */
export const getStoreOverview = async (storeId, dateRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const [
    orderStats,
    productStats,
    revenueByDay,
    topProducts
  ] = await Promise.all([
    // Order statistics
    Order.aggregate([
      {
        $match: {
          storeId: storeId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" }
        }
      }
    ]),

    // Product statistics
    Product.aggregate([
      { $match: { storeId: storeId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),

    // Revenue by day
    Order.aggregate([
      {
        $match: {
          storeId: storeId,
          createdAt: { $gte: startDate },
          status: { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.SHIPPED, ORDER_STATUS.PROCESSING] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          revenue: { $sum: "$pricing.totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]),

    // Top products by quantity sold
    Order.aggregate([
      {
        $match: {
          storeId: storeId,
          createdAt: { $gte: startDate },
          status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.titleSnapshot" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ])
  ]);

  // Format order stats
  const orderSummary = {
    total: 0,
    totalRevenue: 0,
    byStatus: {}
  };
  orderStats.forEach(stat => {
    orderSummary.byStatus[stat._id] = { count: stat.count, revenue: stat.revenue };
    orderSummary.total += stat.count;
    if (![ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(stat._id)) {
      orderSummary.totalRevenue += stat.revenue;
    }
  });

  // Format product stats
  const productSummary = {};
  productStats.forEach(stat => {
    productSummary[stat._id] = stat.count;
  });

  return {
    orders: orderSummary,
    products: productSummary,
    revenueByDay,
    topProducts,
    dateRange
  };
};

/**
 * Get store sales report
 */
export const getStoreSalesReport = async (storeId, startDate, endDate) => {
  const match = {
    storeId: storeId,
    status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
  };

  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

  const salesReport = await Order.aggregate([
    { $match: match },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$pricing.totalAmount" },
              avgOrderValue: { $avg: "$pricing.totalAmount" },
              totalItems: { $sum: { $size: "$items" } }
            }
          }
        ],
        byDay: [
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              orders: { $sum: 1 },
              revenue: { $sum: "$pricing.totalAmount" }
            }
          },
          { $sort: { _id: 1 } }
        ],
        byProduct: [
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              productName: { $first: "$items.titleSnapshot" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 20 }
        ]
      }
    }
  ]);

  const result = salesReport[0];
  return {
    summary: result.summary[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalItems: 0 },
    byDay: result.byDay,
    byProduct: result.byProduct
  };
};

/**
 * Get store customer analytics
 */
export const getStoreCustomerAnalytics = async (storeId, dateRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const analytics = await Order.aggregate([
    {
      $match: {
        storeId: storeId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$pricing.totalAmount" },
        firstOrder: { $min: "$createdAt" },
        lastOrder: { $max: "$createdAt" }
      }
    },
    {
      $facet: {
        totalCustomers: [{ $count: "count" }],
        repeatCustomers: [
          { $match: { orderCount: { $gt: 1 } } },
          { $count: "count" }
        ],
        topCustomers: [
          { $sort: { totalSpent: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user"
            }
          },
          { $unwind: "$user" },
          {
            $project: {
              userId: "$_id",
              email: "$user.email",
              orderCount: 1,
              totalSpent: 1
            }
          }
        ],
        avgMetrics: [
          {
            $group: {
              _id: null,
              avgOrdersPerCustomer: { $avg: "$orderCount" },
              avgSpentPerCustomer: { $avg: "$totalSpent" }
            }
          }
        ]
      }
    }
  ]);

  const result = analytics[0];
  return {
    totalCustomers: result.totalCustomers[0]?.count || 0,
    repeatCustomers: result.repeatCustomers[0]?.count || 0,
    topCustomers: result.topCustomers,
    avgOrdersPerCustomer: result.avgMetrics[0]?.avgOrdersPerCustomer || 0,
    avgSpentPerCustomer: result.avgMetrics[0]?.avgSpentPerCustomer || 0,
    dateRange
  };
};

/**
 * Get historical daily metrics for a store
 */
export const getStoreDailyMetrics = async (storeId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return SellerMetricsDaily.find({
    storeId,
    date: { $gte: startDate }
  })
    .sort({ date: 1 })
    .lean();
};

// ============== PLATFORM ANALYTICS ==============

/**
 * Get platform-wide analytics (admin)
 */
export const getPlatformAnalytics = async (dateRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const [
    orderStats,
    userGrowth,
    revenueStats,
    topStores,
    categoryPerformance
  ] = await Promise.all([
    // Order statistics
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" }
        }
      }
    ]),

    // User growth
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Revenue by day
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Top performing stores
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
        }
      },
      {
        $group: {
          _id: "$storeId",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store"
        }
      },
      { $unwind: "$store" },
      {
        $project: {
          storeId: "$_id",
          storeName: "$store.storeIdentity.name",
          orderCount: 1,
          revenue: 1
        }
      }
    ]),

    // Category performance
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.categoryId",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: "$_id",
          categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
          quantity: 1,
          revenue: 1
        }
      }
    ])
  ]);

  // Format stats
  const orderSummary = {
    total: 0,
    totalRevenue: 0,
    byStatus: {}
  };
  orderStats.forEach(stat => {
    orderSummary.byStatus[stat._id] = { count: stat.count, revenue: stat.revenue };
    orderSummary.total += stat.count;
    if (![ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(stat._id)) {
      orderSummary.totalRevenue += stat.revenue;
    }
  });

  return {
    orders: orderSummary,
    userGrowth,
    revenueByDay: revenueStats,
    topStores,
    categoryPerformance,
    dateRange
  };
};

/**
 * Get payment analytics (admin)
 */
export const getPaymentAnalytics = async (dateRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const analytics = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              amount: { $sum: "$amount" }
            }
          }
        ],
        byDay: [
          { $match: { status: PAYMENT_STATUS.SUCCESS } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
              amount: { $sum: "$amount" }
            }
          },
          { $sort: { _id: 1 } }
        ],
        byProvider: [
          {
            $group: {
              _id: "$provider",
              count: { $sum: 1 },
              successCount: {
                $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.SUCCESS] }, 1, 0] }
              },
              totalAmount: {
                $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.SUCCESS] }, "$amount", 0] }
              }
            }
          }
        ]
      }
    }
  ]);

  const result = analytics[0];
  return {
    byStatus: Object.fromEntries(result.byStatus.map(s => [s._id, { count: s.count, amount: s.amount }])),
    byDay: result.byDay,
    byProvider: result.byProvider,
    dateRange
  };
};

/**
 * Generate and store daily metrics for a store
 */
export const generateDailyMetrics = async (storeId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const metrics = await Order.aggregate([
    {
      $match: {
        storeId: storeId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $facet: {
        orderMetrics: [
          {
            $match: {
              status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$pricing.totalAmount" },
              uniqueCustomers: { $addToSet: "$userId" }
            }
          }
        ],
        refunds: [
          { $match: { status: ORDER_STATUS.REFUNDED } },
          { $count: "count" }
        ]
      }
    }
  ]);

  const result = metrics[0];
  const orderData = result.orderMetrics[0] || { totalOrders: 0, totalRevenue: 0, uniqueCustomers: [] };
  const refundCount = result.refunds[0]?.count || 0;

  // Upsert daily metrics
  await SellerMetricsDaily.findOneAndUpdate(
    { storeId, date: startOfDay },
    {
      storeId,
      date: startOfDay,
      totalOrders: orderData.totalOrders,
      totalRevenue: orderData.totalRevenue,
      uniqueCustomers: orderData.uniqueCustomers?.length || 0,
      refunds: refundCount
    },
    { upsert: true, new: true }
  );

  return {
    storeId,
    date: startOfDay,
    totalOrders: orderData.totalOrders,
    totalRevenue: orderData.totalRevenue,
    uniqueCustomers: orderData.uniqueCustomers?.length || 0,
    refunds: refundCount
  };
};

export default {
  getStoreOverview,
  getStoreSalesReport,
  getStoreCustomerAnalytics,
  getStoreDailyMetrics,
  getPlatformAnalytics,
  getPaymentAnalytics,
  generateDailyMetrics
};
