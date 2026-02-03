// Wrapper for async route handlers to catch errors automatically
const asyncHandler = (requestHandler) => {
    return async (req, res, next) =>{
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err)); // Pass errors to error middleware
    }
}

export { asyncHandler };