const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error');
const repo = require('./careers.repository');

function normalizeCareerPayload(input) {
  const payload = { ...input };
  if ('badgeUrl' in payload && payload.badgeUrl === '') payload.badgeUrl = null;
  if ('flagUrl' in payload && payload.flagUrl === '') payload.flagUrl = null;
  if ('updatedAt' in payload && payload.updatedAt) {
    payload.profileUpdatedAt = new Date(payload.updatedAt);
    delete payload.updatedAt;
  }
  return payload;
}

async function listCareers(userId) {
  return repo.listCareers(userId);
}

async function createCareer(userId, input) {
  const payload = normalizeCareerPayload(input);
  const totalCareers = await prisma.career.count({ where: { userId } });
  const shouldActivate = input.isActive || totalCareers === 0;

  if (shouldActivate) {
    await prisma.career.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  return repo.createCareer({
    userId,
    ...payload,
    isActive: shouldActivate,
  });
}

async function getCareer(userId, id) {
  const career = await repo.getCareer(userId, id);
  if (!career) throw new AppError('Career not found', 404, 'NOT_FOUND');
  return career;
}

async function updateCareer(userId, id, input) {
  await repo.assertCareerOwnership(id, userId);
  const payload = normalizeCareerPayload(input);

  if (input.isActive) {
    await prisma.career.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  return repo.updateCareer(id, payload);
}

async function deleteCareer(userId, id) {
  await repo.assertCareerOwnership(id, userId);
  await repo.deleteCareer(id);
}

async function activateCareer(userId, id) {
  await repo.assertCareerOwnership(id, userId);
  await prisma.$transaction([
    prisma.career.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.career.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);
}

module.exports = {
  listCareers,
  createCareer,
  getCareer,
  updateCareer,
  deleteCareer,
  activateCareer,
};
