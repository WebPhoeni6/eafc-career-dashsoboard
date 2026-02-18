function success(res, data = null, message = 'Success', statusCode = 200, meta) {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

function error(res, message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details) {
  const payload = {
    success: false,
    error: { code, message },
  };
  if (details) payload.error.details = details;
  return res.status(statusCode).json(payload);
}

function badRequest(res, message = 'Bad request', details) {
  return error(res, message, 400, 'BAD_REQUEST', details);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

function notFound(res, message = 'Not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
};
