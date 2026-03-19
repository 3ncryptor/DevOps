import { ApiResponse } from '../../src/utils/ApiResponse.js';

describe('ApiResponse Unit Test', () => {
    it('should correctly format a 200 SUCCESS response', () => {
        const response = new ApiResponse(200, { key: 'value' }, 'Success Message');

        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual({ key: 'value' });
        expect(response.message).toBe('Success Message');
        expect(response.success).toBe(true);
    });

    it('should correctly format a 400 ERR response', () => {
        const response = new ApiResponse(400, null, 'Error Message');

        expect(response.statusCode).toBe(400);
        expect(response.data).toBeNull();
        expect(response.message).toBe('Error Message');
        expect(response.success).toBe(false);
    });

    it('should return default message if no message provided', () => {
        const response = new ApiResponse(201, { new: 'item' });

        expect(response.statusCode).toBe(201);
        expect(response.message).toBe('Successful');
        expect(response.success).toBe(true);
    });
});
