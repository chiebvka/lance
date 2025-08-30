// main/utils/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// General rate limiting for content creation/updates
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

// Authentication-specific rate limiters
export const authRateLimit = {
  // Signup: 3 attempts per hour per IP
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
  }),
  
  // Login: 5 attempts per 15 minutes per IP, 20 per hour
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
  }),
  
  // Forgot password: 3 attempts per hour per IP, 8 per day
  forgotPassword: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
  }),
  
  // Daily limit for forgot password
  forgotPasswordDaily: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "24 h"),
  }),
};