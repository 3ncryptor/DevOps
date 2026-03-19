import { ApiError } from '../../src/utils/ApiError.js';

describe('ApiError Unit Test', () => {
    it('should be an instance of Error', () => {
        const err = new ApiError(400, 'Bad Request');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(ApiError);
    });

    it('should set statusCode, message, and success correctly', () => {
        const err = new ApiError(422, 'Validation failed');

        expect(err.statusCode).toBe(422);
        expect(err.message).toBe('Validation failed');
        expect(err.success).toBe(false);
    });

    it('should always have success = false regardless of status code', () => {
        // Even a "200-like" code should be false — ApiError represents an error
        const err = new ApiError(200, 'Should still be an error');
        expect(err.success).toBe(false);
    });

    it('should use default message when none provided', () => {
        const err = new ApiError(500);
        expect(err.message).toBe('Something went wrong');
    });

    it('should default errors to an empty array', () => {
        const err = new ApiError(400, 'Bad Request');
        expect(err.errors).toEqual([]);
    });

    it('should store validation errors array correctly', () => {
        const validationErrors = [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password too short' },
        ];
        const err = new ApiError(400, 'Validation failed', validationErrors);

        expect(err.errors).toHaveLength(2);
        expect(err.errors[0].field).toBe('email');
        expect(err.errors[1].field).toBe('password');
    });

    it('should capture a stack trace automatically', () => {
        const err = new ApiError(500, 'Internal error');
        expect(err.stack).toBeDefined();
        expect(typeof err.stack).toBe('string');
    });

    it('should use a custom stack when provided', () => {
        const customStack = 'custom stack trace here';
        const err = new ApiError(500, 'Internal error', [], customStack);
        expect(err.stack).toBe(customStack);
    });

    it('should expose message as a string property on the error', () => {
        const err = new ApiError(404, 'Not Found');
        // Verify it's accessible both as .message and via string coercion
        expect(err.message).toBe('Not Found');
        expect(String(err)).toContain('Not Found');
    });
});
