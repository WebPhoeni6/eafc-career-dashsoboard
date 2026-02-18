const prisma = require('../../config/database');

const trophy = {
  list: (careerId) => prisma.trophy.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.trophy.create({ data }),
  remove: (careerId, id) => prisma.trophy.deleteMany({ where: { id, careerId } }),
};

const challenge = {
  list: (careerId) =>
    prisma.seasonChallenge.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.seasonChallenge.create({ data }),
  update: (careerId, id, data) => prisma.seasonChallenge.updateMany({ where: { id, careerId }, data }),
  remove: (careerId, id) => prisma.seasonChallenge.deleteMany({ where: { id, careerId } }),
};

const narrativeTag = {
  list: (careerId) =>
    prisma.narrativeTag.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.narrativeTag.create({ data }),
  remove: (careerId, id) => prisma.narrativeTag.deleteMany({ where: { id, careerId } }),
};

module.exports = {
  trophy,
  challenge,
  narrativeTag,
};
