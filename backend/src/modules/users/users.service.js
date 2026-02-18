const usersRepo = require('./users.repository');
const { AppError } = require('../../middlewares/error');

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getMe(userId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return toSafeUser(user);
}

async function updateMe(userId, input) {
  const user = await usersRepo.updateById(userId, {
    ...input,
    avatarUrl: input.avatarUrl === '' ? null : input.avatarUrl,
  });
  return toSafeUser(user);
}

async function deleteMe(userId) {
  await usersRepo.deleteById(userId);
}

module.exports = {
  getMe,
  updateMe,
  deleteMe,
};
