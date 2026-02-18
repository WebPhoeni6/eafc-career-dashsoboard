const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
