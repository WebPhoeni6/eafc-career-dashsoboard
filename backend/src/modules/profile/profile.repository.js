const prisma = require('../../config/database');

const injury = {
  list: (careerId) => prisma.injuryLog.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.injuryLog.create({ data }),
  update: (careerId, id, data) => prisma.injuryLog.updateMany({ where: { id, careerId }, data }),
  remove: (careerId, id) => prisma.injuryLog.deleteMany({ where: { id, careerId } }),
};

const suspension = {
  list: (careerId) => prisma.suspension.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.suspension.create({ data }),
  remove: (careerId, id) => prisma.suspension.deleteMany({ where: { id, careerId } }),
};

const pressNote = {
  list: (careerId) => prisma.pressNote.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.pressNote.create({ data }),
  remove: (careerId, id) => prisma.pressNote.deleteMany({ where: { id, careerId } }),
};

const achievement = {
  list: (careerId) => prisma.achievement.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  findByKey: (careerId, key) => prisma.achievement.findFirst({ where: { careerId, key } }),
  create: (data) => prisma.achievement.create({ data }),
  update: (careerId, id, data) => prisma.achievement.updateMany({ where: { id, careerId }, data }),
};

module.exports = {
  injury,
  suspension,
  pressNote,
  achievement,
};
