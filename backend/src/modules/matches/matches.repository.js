const prisma = require('../../config/database');

function list(where, skip, take) {
  return prisma.match.findMany({
    where,
    skip,
    take,
    orderBy: [{ matchDate: 'desc' }, { createdAt: 'desc' }],
  });
}

function count(where) {
  return prisma.match.count({ where });
}

function create(data) {
  return prisma.match.create({ data });
}

function findByCareerAndId(careerId, id) {
  return prisma.match.findFirst({ where: { id, careerId } });
}

function update(id, data) {
  return prisma.match.update({ where: { id }, data });
}

function remove(id) {
  return prisma.match.delete({ where: { id } });
}

module.exports = {
  list,
  count,
  create,
  findByCareerAndId,
  update,
  remove,
};
