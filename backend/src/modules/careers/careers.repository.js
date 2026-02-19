const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error');

let ensureCareerDirectorStorePromise = null;

async function ensureCareerDirectorStore() {
  if (ensureCareerDirectorStorePromise) return ensureCareerDirectorStorePromise;
  ensureCareerDirectorStorePromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS career_director_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        career_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_career_director_events_user_career_created
      ON career_director_events (user_id, career_id, created_at DESC)
    `);
  })();
  return ensureCareerDirectorStorePromise;
}

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

async function insertCareerDirectorEvent(userId, careerId, eventType, payload) {
  await ensureCareerDirectorStore();
  const payloadJson = JSON.stringify(payload || {});
  const id = payload && typeof payload.id === 'string' ? payload.id : null;
  if (!id) throw new AppError('Career director event id is required', 500, 'SERVER_ERROR');

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO career_director_events (id, user_id, career_id, event_type, payload, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    `,
    id,
    userId,
    careerId,
    eventType,
    payloadJson,
  );
}

async function listCareerDirectorEvents(userId, careerId, limit = 200) {
  await ensureCareerDirectorStore();
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT id, event_type, payload, created_at
      FROM (
        SELECT id, event_type, payload, created_at
        FROM career_director_events
        WHERE user_id = $1 AND career_id = $2
        ORDER BY created_at DESC
        LIMIT $3
      ) recent
      ORDER BY created_at ASC
    `,
    userId,
    careerId,
    safeLimit,
  );

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    payload:
      typeof row.payload === 'string'
        ? (() => {
            try {
              return JSON.parse(row.payload);
            } catch (_) {
              return {};
            }
          })()
        : row.payload || {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));
}

module.exports = {
  assertCareerOwnership,
  listCareers,
  createCareer,
  getCareer,
  updateCareer,
  deleteCareer,
  getCareerInsightsData,
  insertCareerDirectorEvent,
  listCareerDirectorEvents,
};
