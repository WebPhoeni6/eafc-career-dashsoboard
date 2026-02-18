const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error');

async function assertCareerOwnership(careerId, userId) {
  const career = await prisma.career.findFirst({
    where: { id: careerId, userId },
  });

  if (!career) {
    throw new AppError('Career not found', 404, 'NOT_FOUND');
  }

  return career;
}

function listCareers(userId) {
  return prisma.career.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

function createCareer(data) {
  return prisma.career.create({ data });
}

async function getCareer(userId, id) {
  return prisma.career.findFirst({
    where: { id, userId },
  });
}

function updateCareer(id, data) {
  return prisma.career.update({ where: { id }, data });
}

function deleteCareer(id) {
  return prisma.career.delete({ where: { id } });
}

function getCareerInsightsData(userId, id) {
  return prisma.career.findFirst({
    where: { id, userId },
    include: {
      matches: true,
      trophies: true,
      challenges: true,
      narrativeTags: true,
      skillSpends: true,
      attributeTargets: true,
      archetypeStage: true,
      trainingLogs: true,
      offers: true,
      contracts: true,
      agentNotes: true,
      injuries: true,
      suspensions: true,
      pressNotes: true,
      achievements: true,
    },
  });
}

module.exports = {
  assertCareerOwnership,
  listCareers,
  createCareer,
  getCareer,
  updateCareer,
  deleteCareer,
  getCareerInsightsData,
};
