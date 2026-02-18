const prisma = require('../../config/database');

const skillSpend = {
  list: (careerId) => prisma.skillSpend.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.skillSpend.create({ data }),
  remove: (careerId, id) => prisma.skillSpend.deleteMany({ where: { id, careerId } }),
};

const attributeTarget = {
  list: (careerId) =>
    prisma.attributeTarget.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.attributeTarget.create({ data }),
  update: (careerId, id, data) =>
    prisma.attributeTarget.updateMany({
      where: { id, careerId },
      data,
    }),
  remove: (careerId, id) => prisma.attributeTarget.deleteMany({ where: { id, careerId } }),
};

const archetypeStage = {
  get: (careerId) => prisma.archetypeStage.findUnique({ where: { careerId } }),
  upsert: (careerId, data) =>
    prisma.archetypeStage.upsert({
      where: { careerId },
      create: { careerId, ...data },
      update: data,
    }),
};

const trainingLog = {
  list: (careerId) => prisma.trainingLog.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.trainingLog.create({ data }),
  remove: (careerId, id) => prisma.trainingLog.deleteMany({ where: { id, careerId } }),
};

module.exports = {
  skillSpend,
  attributeTarget,
  archetypeStage,
  trainingLog,
};
