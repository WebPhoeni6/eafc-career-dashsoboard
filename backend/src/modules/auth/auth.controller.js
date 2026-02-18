const config = require('../../config/env');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const authService = require('./auth.service');

const REFRESH_COOKIE_NAME = 'refreshToken';

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, config.cookie);
}

const signup = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const result = await authService.signup(payload);
  setRefreshCookie(res, result.refreshToken);
  return success(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Signup successful',
    201,
  );
});

const login = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const result = await authService.login(payload);
  setRefreshCookie(res, result.refreshToken);
  return success(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  return success(res, { accessToken: result.accessToken }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  await authService.logout(refreshToken);
  res.clearCookie(REFRESH_COOKIE_NAME, config.cookie);
  return res.status(204).send();
});

const forgotPassword = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const data = await authService.forgotPassword(payload);
  return success(res, data, 'Password reset request accepted');
});

const resetPassword = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  await authService.resetPassword(payload);
  return success(res, null, 'Password reset successful');
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
