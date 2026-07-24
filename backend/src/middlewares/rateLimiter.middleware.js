import redis from '../config/redis.js';

/**
 * Middleware to rate-limit OTP generation requests.
 * Rules:
 * 1. Cooldown: Minimum 60 seconds between consecutive OTP requests for the same email.
 * 2. Sliding Window: Maximum 3 OTP requests within 10 minutes (600 seconds) for the same email.
 */
export const otpRequestRateLimiter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next();

    const normalizedEmail = email.toLowerCase().trim();
    const cooldownKey = `ratelimit:otp:cooldown:${normalizedEmail}`;
    const countKey = `ratelimit:otp:count:${normalizedEmail}`;

    // 1. Check 60-second cooldown
    const isCoolingDown = await redis.get(cooldownKey);
    if (isCoolingDown) {
      const remainingSec = await redis.ttl(cooldownKey);
      return res.status(429).json({
        message: `Please wait ${remainingSec > 0 ? remainingSec : 60} seconds before requesting another OTP.`
      });
    }

    // 2. Check 10-minute count limit (max 3 requests)
    const currentCount = await redis.get(countKey);
    if (currentCount && parseInt(currentCount, 10) >= 3) {
      const remainingSec = await redis.ttl(countKey);
      const remainingMins = Math.ceil((remainingSec > 0 ? remainingSec : 600) / 60);
      return res.status(429).json({
        message: `Maximum OTP request limit reached (3 per 10 mins). Please try again in ${remainingMins} minute(s).`
      });
    }

    next();
  } catch (error) {
    console.error('OTP Rate Limiter Error:', error);
    next(); // Fallthrough safely if Redis encounters an error
  }
};

/**
 * Middleware to block logins if account has exceeded failed login threshold.
 * Rules: Max 5 failed attempts per 15 minutes (900 seconds).
 */
export const loginRateLimiter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next();

    const normalizedEmail = email.toLowerCase().trim();
    const failedKey = `ratelimit:login:failed:${normalizedEmail}`;

    const failedCount = await redis.get(failedKey);
    if (failedCount && parseInt(failedCount, 10) >= 5) {
      const remainingSec = await redis.ttl(failedKey);
      const remainingMins = Math.ceil((remainingSec > 0 ? remainingSec : 900) / 60);
      return res.status(429).json({
        message: `Too many failed login attempts. Account temporarily locked. Please try again after ${remainingMins} minute(s).`
      });
    }

    next();
  } catch (error) {
    console.error('Login Rate Limiter Error:', error);
    next();
  }
};

/**
 * Record OTP send event in Redis (sets 60s cooldown and increments 10-minute counter)
 */
export const recordOtpRequest = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const cooldownKey = `ratelimit:otp:cooldown:${normalizedEmail}`;
  const countKey = `ratelimit:otp:count:${normalizedEmail}`;

  // Set 60s cooldown
  await redis.set(cooldownKey, '1', 'EX', 60);

  // Increment 10-minute count
  const multi = redis.multi();
  multi.incr(countKey);
  multi.ttl(countKey);
  const results = await multi.exec();

  // If key was newly created, set TTL of 10 mins (600s)
  const ttl = results[1][1];
  if (ttl === -1 ) {
    await redis.expire(countKey, 600);
  }
};

/**
 * Record a failed login attempt in Redis (expires in 15 mins = 900s)
 */
export const recordFailedLogin = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const failedKey = `ratelimit:login:failed:${normalizedEmail}`;

  const multi = redis.multi();
  multi.incr(failedKey);
  multi.ttl(failedKey);
  const results = await multi.exec();

  const ttl = results[1][1];
  if (ttl === -1 ) {
    await redis.expire(failedKey, 900); // 15 mins
  }
};

/**
 * Clear failed login attempts counter on successful login
 */
export const clearFailedLogins = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const failedKey = `ratelimit:login:failed:${normalizedEmail}`;
  await redis.del(failedKey);
};

/**
 * Record a failed OTP verification attempt (invalidates OTP after 5 wrong tries)
 */
export const recordFailedOtpVerify = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const verifyKey = `ratelimit:otp:verify:${normalizedEmail}`;

  const count = await redis.incr(verifyKey);
  if (count === 1) {
    await redis.expire(verifyKey, 600);
  }

  if (count >= 5) {
    // Invalidate OTP in Redis and delete verification attempt counter
    await redis.del(`otp:${normalizedEmail}`);
    await redis.del(verifyKey);
    return true; // Indicates OTP was invalidated due to max retries
  }

  return false;
};
