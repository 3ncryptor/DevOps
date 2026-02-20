import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    errorMiddleware,
    notFoundHandler,
} from './middlewares/error.middleware.js';
import {
    requestLoggerWithSkip,
    errorRequestLogger,
} from './middlewares/requestLogger.middleware.js';
import { ApiResponse } from './utils/ApiResponse.js';
import swaggerSpec from './config/swagger.config.js';
import routes from './routes/index.js';
import { getConnectionStatus } from './db/connect.js';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security: Disable x-powered-by header
app.disable('x-powered-by');

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const envOrigins = process.env.CORS_ORIGIN?.split(',') || [];
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8000', // Allow Swagger UI
            ...envOrigins,
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (
            !origin ||
            allowedOrigins.includes(origin) ||
            allowedOrigins.includes('*')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
    ],
};
app.use(cors(corsOptions));

// Core middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Request logging with Winston (skip health checks and static files)
app.use(requestLoggerWithSkip(['/health', '/favicon.ico', '/public']));

// Static files (for uploaded files if needed)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Swagger API Documentation
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Zentra API Documentation',
    })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (_, res) => {
    const dbStatus = getConnectionStatus();
    const isHealthy = dbStatus.state === 'connected';
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json(
        new ApiResponse(
            statusCode,
            {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                database: {
                    status: dbStatus.state,
                    host: dbStatus.host,
                    name: dbStatus.name,
                },
                memory: {
                    used:
                        Math.round(
                            process.memoryUsage().heapUsed / 1024 / 1024
                        ) + ' MB',
                    total:
                        Math.round(
                            process.memoryUsage().heapTotal / 1024 / 1024
                        ) + ' MB',
                },
            },
            isHealthy ? 'Zentra API is healthy' : 'Zentra API is unhealthy'
        )
    );
});

// API version info
app.get('/', (_, res) => {
    res.status(200).json(
        new ApiResponse(
            200,
            {
                name: 'Zentra Commerce API',
                version: '1.0.0',
                documentation: '/api-docs',
            },
            'Welcome to Zentra API'
        )
    );
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes (before error middleware)
app.use(notFoundHandler);

// Error Request Logger (logs errors before handling)
app.use(errorRequestLogger);

// Global Error Handler (ALWAYS LAST)
app.use(errorMiddleware);

export default app;
