/**
 * Seller Metrics Job
 * Generates daily metrics for all active stores
 *
 * Run this job daily (e.g., via cron at midnight)
 * Example cron: 0 0 * * * node -e "import('./src/jobs/sellerMetrics.job.js').then(m => m.runJob())"
 */

import { Store } from '../models/store.model.js';
import { generateDailyMetrics } from '../services/analytics.service.js';
import { STORE_STATUS } from '../constants/platform.js';
import { logger, logJob } from '../config/logger.config.js';

/**
 * Generate daily metrics for all active stores
 */
export const generateAllStoreMetrics = async (date = new Date()) => {
    // Get yesterday's date by default
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() - 1);

    const startTime = Date.now();
    logJob.started('SellerMetrics');
    logger.info(
        `Starting metrics generation for ${targetDate.toISOString().split('T')[0]}`
    );

    try {
        // Get all active stores
        const stores = await Store.find({ storeStatus: STORE_STATUS.ACTIVE })
            .select('_id storeIdentity.name')
            .lean();

        logger.info(
            `Found ${stores.length} active stores for metrics generation`
        );

        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };

        // Process stores in batches of 10
        const batchSize = 10;
        for (let i = 0; i < stores.length; i += batchSize) {
            const batch = stores.slice(i, i + batchSize);

            const batchResults = await Promise.allSettled(
                batch.map((store) =>
                    generateDailyMetrics(store._id, targetDate)
                )
            );

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({
                        storeId: batch[index]._id,
                        storeName: batch[index].storeIdentity?.name,
                        error: result.reason?.message || 'Unknown error',
                    });
                }
            });
        }

        const duration = Date.now() - startTime;
        logJob.completed('SellerMetrics', duration, results);

        if (results.errors.length > 0) {
            logger.warn('Some stores failed metrics generation', {
                errors: results.errors,
            });
        }

        return results;
    } catch (error) {
        logJob.failed('SellerMetrics', error);
        throw error;
    }
};

/**
 * Generate metrics for a specific date range (backfill)
 */
export const backfillMetrics = async (startDate, endDate) => {
    logger.info(`Backfilling metrics from ${startDate} to ${endDate}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    const results = [];

    while (current <= end) {
        const dayResults = await generateAllStoreMetrics(current);
        results.push({
            date: current.toISOString().split('T')[0],
            ...dayResults,
        });
        current.setDate(current.getDate() + 1);
    }

    logger.info('Backfill complete', { totalDays: results.length });
    return results;
};

/**
 * Run job (entry point for cron)
 */
export const runJob = async () => {
    try {
        await generateAllStoreMetrics();
        process.exit(0);
    } catch (error) {
        logger.error('SellerMetrics job failed', { error: error.message });
        process.exit(1);
    }
};

export default {
    generateAllStoreMetrics,
    backfillMetrics,
    runJob,
};
