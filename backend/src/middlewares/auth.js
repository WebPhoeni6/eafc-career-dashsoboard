const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('./error');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return next(new AppError('Invalid access token', 401, 'UNAUTHORIZED'));
  }

  req.user = { id: payload.sub };
  return next();
}

module.exports = {
  requireAuth,
};
