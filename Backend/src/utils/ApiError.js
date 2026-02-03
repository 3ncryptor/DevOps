// Custom error class for API errors with standardized format
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong", 
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors; // Additional error details
        this.success = false;
        
        // Custom stack trace or capture current
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);   
        }
    }

}

export { ApiError };
export default ApiError;