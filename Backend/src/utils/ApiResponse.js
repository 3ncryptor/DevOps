// Standardized API response format
class ApiResponse {
    constructor(statusCode, data, message = 'Successful') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 300; // Auto-determine success
    }
}

export { ApiResponse };
