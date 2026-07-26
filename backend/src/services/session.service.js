import redis from '../config/redis.js';
import crypto from 'crypto';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days TTL in seconds

/**
 * Creates a new session in Redis using a Redis Hash (HSET)
 * @param {Object} params
 * @param {string|Object} params.userId
 * @param {string} [params.refreshTokenHash='']
 * @param {string} [params.userAgent='']
 * @param {string} [params.ip='']
 * @returns {Promise<{ sessionId: string, sessionData: Object }>}
 */
export const createRedisSession = async ({ userId, refreshTokenHash = '', userAgent = '', ip = '' }) => {
  const sessionId = crypto.randomUUID();
  const userIdStr = userId.toString();
  const sessionKey = `session:${sessionId}`;
  const userSessionsKey = `user_sessions:${userIdStr}`;

  const sessionData = {
    id: sessionId,
    userId: userIdStr,
    refreshTokenHash: refreshTokenHash || '',
    userAgent: userAgent || '',
    ip: ip || '',
    isValid: 'true',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL * 1000).toISOString(),
  };

  // Store fields in Redis Hash
  await redis.hset(sessionKey, sessionData);
  await redis.expire(sessionKey, SESSION_TTL);

  // Track session ID in user's active sessions set
  await redis.sadd(userSessionsKey, sessionId);
  await redis.expire(userSessionsKey, SESSION_TTL);

  return { sessionId, sessionData };
};

/**
 * Retrieves a session from Redis Hash (HGETALL)
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
export const getRedisSession = async (sessionId) => {
  if (!sessionId) return null;
  const session = await redis.hgetall(`session:${sessionId}`);

  // HGETALL returns an empty object {} if key does not exist in Redis
  if (!session || !session.id) {
    return null;
  }

  return {
    ...session,
    isValid: session.isValid === 'true',
  };
};

/**
 * Updates specific fields in the Redis Hash using HSET
 * @param {string} sessionId
 * @param {Object} fieldsToUpdate
 * @returns {Promise<Object|null>}
 */
export const updateRedisSessionFields = async (sessionId, fieldsToUpdate) => {
  const sessionKey = `session:${sessionId}`;
  const existing = await getRedisSession(sessionId);
  if (!existing) return null;

  const updates = {};
  for (const [key, value] of Object.entries(fieldsToUpdate)) {
    updates[key] = String(value);
  }

  // Extend expiration date
  updates.expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();

  await redis.hset(sessionKey, updates);
  await redis.expire(sessionKey, SESSION_TTL);
  await redis.expire(`user_sessions:${existing.userId}`, SESSION_TTL);

  return getRedisSession(sessionId);
};

/**
 * Updates refresh token hash and extends TTL (convenience function)
 * @param {string} sessionId
 * @param {string} newRefreshTokenHash
 */
export const updateRedisSessionToken = async (sessionId, newRefreshTokenHash) => {
  return updateRedisSessionFields(sessionId, { refreshTokenHash: newRefreshTokenHash });
};
/**
 * Revokes and deletes a single session from Redis Hash and User Set
 * @param {string} sessionId
 */
export const revokeRedisSession = async (sessionId) => {
  const session = await getRedisSession(sessionId);
  if (session) {
    await redis.del(`session:${sessionId}`);
    await redis.srem(`user_sessions:${session.userId}`, sessionId);
  }
};

/**
 * Revokes all active sessions for a user (e.g., on token reuse detection or password reset)
 * @param {string|Object} userId
 */
export const revokeAllUserSessions = async (userId) => {
  const userIdStr = userId.toString();
  const userSessionsKey = `user_sessions:${userIdStr}`;
  const sessionIds = await redis.smembers(userSessionsKey);

  if (sessionIds && sessionIds.length > 0) {
    const pipeline = redis.pipeline();
    sessionIds.forEach((sId) => {
      pipeline.del(`session:${sId}`);
    });
    pipeline.del(userSessionsKey);
    await pipeline.exec();
  }
};
