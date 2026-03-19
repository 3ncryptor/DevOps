import request from 'supertest';
import app from '../../src/app.js';

const BASE = '/api/v1/auth';
const TEST_EMAIL = `authtest_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';

describe('Auth API Integration', () => {
    // Register once before all tests in this file so subsequent
    // describe blocks can login/use the same user. The global
    // afterEach in setup.js wipes the DB between EACH test, so we
    // re-register at the start of each nested describe that needs a user.
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user and return 201', async () => {
            const response = await request(app)
                .post(`${BASE}/register`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.email).toBe(TEST_EMAIL);
            // Sensitive field must NEVER be in the response
            expect(response.body.data.passwordHash).toBeUndefined();
        });

        it('should return 409 when registering with a duplicate email', async () => {
            // Register the same email twice in a single test — no DB wipe in between
            await request(app)
                .post(`${BASE}/register`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            const response = await request(app)
                .post(`${BASE}/register`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post(`${BASE}/register`)
                .send({ password: TEST_PASSWORD });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when password is missing', async () => {
            const response = await request(app)
                .post(`${BASE}/register`)
                .send({ email: 'nopassword@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when password does not meet complexity rules', async () => {
            const response = await request(app)
                .post(`${BASE}/register`)
                .send({ email: 'weakpass@example.com', password: 'weak' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        // Register a fresh user before this group of tests
        beforeEach(async () => {
            await request(app)
                .post(`${BASE}/register`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        });

        it('should login with valid credentials and return an access token', async () => {
            const response = await request(app)
                .post(`${BASE}/login`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.accessToken).toBeDefined();
            expect(typeof response.body.data.accessToken).toBe('string');
            // Refresh token must be in httpOnly cookie, NOT in the body
            expect(response.body.data.refreshToken).toBeUndefined();
        });

        it('should return 401 with wrong password', async () => {
            const response = await request(app)
                .post(`${BASE}/login`)
                .send({ email: TEST_EMAIL, password: 'WrongPassword1!' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 for a non-existent user (obscured for security)', async () => {
            // The service returns 401 "Invalid credentials" for unknown
            // emails intentionally — never expose whether email exists
            const response = await request(app)
                .post(`${BASE}/login`)
                .send({ email: 'ghost@example.com', password: TEST_PASSWORD });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        let accessToken;

        // Register + login before each test to get a fresh valid token
        beforeEach(async () => {
            await request(app)
                .post(`${BASE}/register`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            const loginRes = await request(app)
                .post(`${BASE}/login`)
                .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

            accessToken = loginRes.body.data.accessToken;
        });

        it('should return 401 when no token is provided', async () => {
            const response = await request(app).get(`${BASE}/me`);
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 with a malformed token', async () => {
            const response = await request(app)
                .get(`${BASE}/me`)
                .set('Authorization', 'Bearer this.is.not.a.valid.token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return current user with a valid token', async () => {
            const response = await request(app)
                .get(`${BASE}/me`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(TEST_EMAIL);
            expect(response.body.data.passwordHash).toBeUndefined();
        });
    });
});
