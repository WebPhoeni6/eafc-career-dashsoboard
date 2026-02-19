const prisma = require('../../config/database');

const offer = {
  list: (careerId) => prisma.transferOffer.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.transferOffer.create({ data }),
  update: (careerId, id, data) => prisma.transferOffer.updateMany({ where: { id, careerId }, data }),
  remove: (careerId, id) => prisma.transferOffer.deleteMany({ where: { id, careerId } }),
};

const contract = {
  list: (careerId) => prisma.contract.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.contract.create({ data }),
  update: (careerId, id, data) => prisma.contract.updateMany({ where: { id, careerId }, data }),
  remove: (careerId, id) => prisma.contract.deleteMany({ where: { id, careerId } }),
};

const agentNote = {
  list: (careerId) => prisma.agentNote.findMany({ where: { careerId }, orderBy: { createdAt: 'desc' } }),
  create: (data) => prisma.agentNote.create({ data }),
  remove: (careerId, id) => prisma.agentNote.deleteMany({ where: { id, careerId } }),
};

module.exports = {
  offer,
  contract,
  agentNote,
};
