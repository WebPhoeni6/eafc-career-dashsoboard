const prisma = require('../../config/database');

function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

function updateById(id, data) {
  return prisma.user.update({ where: { id }, data });
}

function deleteById(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = {
  findById,
  updateById,
  deleteById,
};
