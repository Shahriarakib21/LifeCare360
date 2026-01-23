import rateLimit from 'express-rate-limit';

// Check if we're in development mode (more robust check)
const isDevelopment = 
  process.env.NODE_ENV !== 'production' && 
  process.env.NODE_ENV !== 'test' &&
  (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);

// General API rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 100, // Very high limit in development (effectively disabled)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip in development for easier testing
    if (isDevelopment) {
      return true;
    }
    return false;
  },
  // Disable rate limiting store in development (use memory store which is faster)
  store: isDevelopment ? undefined : undefined,
});

// More lenient rate limiter for auth routes (login/register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 20, // Very high limit in development (effectively disabled)
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip in development for easier testing
    if (isDevelopment) {
      return true;
    }
    return false;
  },
});

export default rateLimiter;

