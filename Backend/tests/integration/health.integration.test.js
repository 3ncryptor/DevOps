import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';

describe('Health & Info API Integration', () => {
    it('GET /health - should return healthy response', async () => {
        const response = await request(app).get('/health');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('healthy');
        expect(response.body.data.database).toBeDefined();
        
        // Assert mongoose readiness based on our setup file connected DB
        expect(response.body.data.database.status).toBe('connected');
    });

    it('GET / - should return API version info', async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.name).toBe('Zentra Commerce API');
        expect(response.body.data.version).toBe('1.0.0');
    });

    it('GET /api-docs.json - should return swagger schema', async () => {
        const response = await request(app).get('/api-docs.json');
        
        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.0');
        expect(response.body.info.title).toBe('Zentra Commerce API');
    });
});
