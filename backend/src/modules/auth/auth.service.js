const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/database');
const config = require('../../config/env');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { hashToken } = require('../../utils/helpers');
const { AppError } = require('../../middlewares/error');

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

function getRefreshExpiryDate(refreshToken) {
  const decoded = jwt.decode(refreshToken);
  if (!decoded || !decoded.exp) {
    throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
  }
  return new Date(decoded.exp * 1000);
}

async function createSession(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);

  await prisma.token.create({
    data: {
      userId,
      tokenHash,
      expiresAt: getRefreshExpiryDate(refreshToken),
    },
  });

  return { accessToken, refreshToken };
}

async function signup(input) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existing) {
    throw new AppError('Email or username already in use', 409, 'CONFLICT');
  }

  const passwordHash = await bcrypt.hash(input.password, config.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      avatarUrl: input.avatarUrl || null,
      passwordHash,
    },
  });

  const session = await createSession(user.id);

  return { user: toSafeUser(user), ...session };
}

async function login(input) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  const session = await createSession(user.id);
  return { user: toSafeUser(user), ...session };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Missing refresh token', 401, 'UNAUTHORIZED');
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload || !payload.sub) {
    throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await prisma.token.findUnique({ where: { tokenHash } });

  if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
    await prisma.token.deleteMany({ where: { userId: payload.sub } });
    throw new AppError('Refresh token reuse detected', 401, 'UNAUTHORIZED');
  }

  await prisma.token.delete({ where: { id: tokenRecord.id } });
  return createSession(payload.sub);
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.token.deleteMany({ where: { tokenHash } });
}

function passwordResetExpiryDate() {
  const ttlMinutes = config.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30;
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
}

function generateRawResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function forgotPassword(input) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always respond success to prevent account enumeration.
  if (!user) {
    return {
      sent: true,
      message: 'If an account exists for that email, a reset link has been generated.',
    };
  }

  const rawToken = generateRawResetToken();
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: passwordResetExpiryDate(),
    },
  });

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }],
    },
  });

  const payload = {
    sent: true,
    message: 'If an account exists for that email, a reset link has been generated.',
  };

  if (!config.isProduction) {
    payload.resetToken = rawToken;
    payload.resetUrl = `${config.primaryCorsOrigin}/?mode=reset&token=${rawToken}`;
  }

  return payload;
}

async function resetPassword(input) {
  const tokenHash = hashToken(input.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    throw new AppError('Reset token is invalid or expired', 400, 'BAD_REQUEST');
  }

  const passwordHash = await bcrypt.hash(input.password, config.BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    }),
    prisma.token.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
