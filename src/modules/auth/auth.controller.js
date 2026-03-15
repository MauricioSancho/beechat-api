const authService = require('./auth.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');
const { jwtConfig } = require('../../config/jwt.config');

const register = asyncHandler(async (req, res) => {
  const { phone, email, username, password, display_name } = req.body;
  const result = await authService.register({ phone, email, username, password, display_name });

  // Refresh token en cookie HttpOnly (web) + body (mobile)
  res.cookie(jwtConfig.refreshCookieName, result.refreshToken, jwtConfig.cookieOptions);

  return sendCreated(res, {
    user: result.user,
    tokens: result.tokens,
    refreshToken: result.refreshToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login({ identifier, password });

  // Refresh token en cookie HttpOnly (web) + body (mobile)
  res.cookie(jwtConfig.refreshCookieName, result.refreshToken, jwtConfig.cookieOptions);

  return sendSuccess(res, {
    user: result.user,
    tokens: result.tokens,
    refreshToken: result.refreshToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[jwtConfig.refreshCookieName] || req.body?.refreshToken;
  await authService.logout(refreshToken);

  res.clearCookie(jwtConfig.refreshCookieName, { path: '/' });

  return sendMessage(res, 'Logged out successfully');
});

const refreshToken = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[jwtConfig.refreshCookieName] || req.body?.refreshToken;

  if (!rawToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
    });
  }

  const result = await authService.refreshAccessToken(rawToken);

  // Emitir nueva cookie con el nuevo refresh token
  res.cookie(jwtConfig.refreshCookieName, result.refreshToken, jwtConfig.cookieOptions);

  return sendSuccess(res, {
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    refreshToken: result.refreshToken,
  });
});

const verifyAccount = asyncHandler(async (req, res) => {
  const { code } = req.body;
  await authService.verifyAccount(req.user.id, code);
  return sendMessage(res, 'Account verified successfully');
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationCode(req.user.id);
  return sendMessage(res, 'Verification code sent to your email');
});

module.exports = { register, login, logout, refreshToken, verifyAccount, resendVerification };
