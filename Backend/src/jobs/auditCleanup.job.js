/**
 * Audit Cleanup Job
 * Cleans up old audit logs to manage database size
 *
 * Run this job periodically (e.g., weekly via cron)
 * Example cron: 0 2 * * 0 node -e "import('./src/jobs/auditCleanup.job.js').then(m => m.runJob())"
 */

import { AuditLog } from '../models/auditLog.model.js';
import { logger, logJob } from '../config/logger.config.js';

// Default retention period in days
const DEFAULT_RETENTION_DAYS = 90;

/**
 * Clean up audit logs older than the retention period
 */
export const cleanupAuditLogs = async (
    retentionDays = DEFAULT_RETENTION_DAYS
) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const startTime = Date.now();
    logJob.started('AuditCleanup');
    logger.info(
        `Starting cleanup of logs older than ${cutoffDate.toISOString()}`
    );

    try {
        // Get count before deletion
        const countBefore = await AuditLog.countDocuments({
            createdAt: { $lt: cutoffDate },
        });

        if (countBefore === 0) {
            logger.info('No audit logs to delete');
            logJob.completed('AuditCleanup', Date.now() - startTime, {
                deleted: 0,
            });
            return { deleted: 0 };
        }

        logger.info(`Found ${countBefore} audit logs to delete`);

        // Delete in batches to avoid overwhelming the database
        const batchSize = 1000;
        let totalDeleted = 0;

        while (true) {
            const result = await AuditLog.deleteMany({
                createdAt: { $lt: cutoffDate },
            }).limit(batchSize);

            if (result.deletedCount === 0) break;

            totalDeleted += result.deletedCount;
            logger.debug(
                `Deleted batch: ${result.deletedCount}, Total: ${totalDeleted}`
            );

            // Small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const duration = Date.now() - startTime;
        logJob.completed('AuditCleanup', duration, { deleted: totalDeleted });

        return { deleted: totalDeleted };
    } catch (error) {
        logJob.failed('AuditCleanup', error);
        throw error;
    }
};

/**
 * Archive audit logs before deleting (optional)
 * This could export to S3, filesystem, or another storage
 */
export const archiveAndCleanup = async (
    retentionDays = DEFAULT_RETENTION_DAYS
) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info(`Archiving logs older than ${cutoffDate.toISOString()}`);

    try {
        // Find logs to archive
        const logsToArchive = await AuditLog.find({
            createdAt: { $lt: cutoffDate },
        }).lean();

        if (logsToArchive.length === 0) {
            logger.info('No logs to archive');
            return { archived: 0, deleted: 0 };
        }

        // TODO: Implement actual archiving (e.g., to S3)
        logger.info(`Would archive ${logsToArchive.length} logs`);

        // After archiving, delete
        const deleteResult = await cleanupAuditLogs(retentionDays);

        return {
            archived: logsToArchive.length,
            deleted: deleteResult.deleted,
        };
    } catch (error) {
        logger.error('Archive error', { error: error.message });
        throw error;
    }
};

/**
 * Get audit log statistics
 */
export const getAuditLogStats = async () => {
    const stats = await AuditLog.aggregate([
        {
            $facet: {
                total: [{ $count: 'count' }],
                byAction: [
                    { $group: { _id: '$action', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ],
                byMonth: [
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { '_id.year': -1, '_id.month': -1 } },
                    { $limit: 12 },
                ],
                oldest: [
                    { $sort: { createdAt: 1 } },
                    { $limit: 1 },
                    { $project: { createdAt: 1 } },
                ],
            },
        },
    ]);

    const result = stats[0];
    return {
        total: result.total[0]?.count || 0,
        byAction: result.byAction,
        byMonth: result.byMonth,
        oldestLog: result.oldest[0]?.createdAt || null,
    };
};

/**
 * Run job (entry point for cron)
 */
export const runJob = async () => {
    try {
        await cleanupAuditLogs();
        process.exit(0);
    } catch (error) {
        logger.error('AuditCleanup job failed', { error: error.message });
        process.exit(1);
    }
};

export default {
    cleanupAuditLogs,
    archiveAndCleanup,
    getAuditLogStats,
    runJob,
};
