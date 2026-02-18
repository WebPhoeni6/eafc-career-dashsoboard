const { AppError } = require('../../middlewares/error');
const fs = require('fs/promises');
const path = require('path');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { stageToEnum, enumToStage, emptyStringToNull, nullToEmptyString } = require('../../utils/helpers');
const { assertCareerOwnership } = require('../careers/careers.repository');
const repo = require('./matches.repository');
const ai = require('./matches.ai');

const COMPETITIONS = new Set(['Friendly', 'League', 'Cup', 'UCL', 'UEL', 'International', 'Other']);
const STAGES = new Set(['N/A', 'Group', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']);
const POSITIONS = new Set(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST']);
const TRUST_LEVELS = new Set(['Full', 'High', 'Medium', 'Low']);

const STAGE_ALIASES = {
  NA: 'N/A',
  'N-A': 'N/A',
  'ROUND OF 16': 'Round of 16',
  ROUNDOF16: 'Round of 16',
  'ROUND 16': 'Round of 16',
  'QUARTER FINAL': 'Quarter-Final',
  QUARTERFINAL: 'Quarter-Final',
  'SEMI FINAL': 'Semi-Final',
  SEMIFINAL: 'Semi-Final',
};

function toFrontendMatch(item) {
  return {
    ...item,
    stage: enumToStage(item.stage),
    ovrAfter: nullToEmptyString(item.ovrAfter),
    spAfter: nullToEmptyString(item.spAfter),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toDbPayload(input) {
  const payload = { ...input };
  if ('stage' in payload) payload.stage = stageToEnum(payload.stage);
  if ('ovrAfter' in payload) payload.ovrAfter = emptyStringToNull(payload.ovrAfter);
  if ('spAfter' in payload) payload.spAfter = emptyStringToNull(payload.spAfter);
  if ('performanceImageUrl' in payload && payload.performanceImageUrl === '') payload.performanceImageUrl = null;
  if ('createdAt' in payload && payload.createdAt) payload.createdAt = new Date(payload.createdAt);
  if ('updatedAt' in payload && payload.updatedAt) payload.updatedAt = new Date(payload.updatedAt);
  return payload;
}

function toPublicUploadPath(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/uploads/');
  if (idx >= 0) return normalized.slice(idx);
  return `/uploads/matches/${path.basename(normalized)}`;
}

function toAbsoluteUploadPath(publicPath) {
  if (!publicPath) return null;
  const clean = publicPath.replace(/^\/+/, '');
  return path.resolve(process.cwd(), clean);
}

async function removeFileIfExists(publicPath) {
  if (!publicPath) return;
  const abs = toAbsoluteUploadPath(publicPath);
  if (!abs) return;
  try {
    await fs.unlink(abs);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toInteger(value) {
  const n = toNumber(value);
  return typeof n === 'number' ? Math.round(n) : undefined;
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return undefined;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDate(value) {
  const raw = normalizeString(value);
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function normalizeStage(value) {
  const raw = normalizeString(value);
  if (!raw) return undefined;
  if (STAGES.has(raw)) return raw;
  const upper = raw.toUpperCase().replace(/\s+/g, ' ').replace(/-/g, ' ').trim();
  return STAGE_ALIASES[upper.replace(/\s+/g, ' ')] || STAGE_ALIASES[upper.replace(/\s+/g, '')];
}

function sanitizeSuggestedMatchFields(source) {
  const input = source && typeof source === 'object' ? source : {};
  const out = {};

  const competition = normalizeString(input.competition);
  if (COMPETITIONS.has(competition)) out.competition = competition;

  const stage = normalizeStage(input.stage);
  if (stage && STAGES.has(stage)) out.stage = stage;

  const matchDate = normalizeDate(input.matchDate);
  if (matchDate) out.matchDate = matchDate;

  const opponent = normalizeString(input.opponent);
  if (opponent) out.opponent = opponent;

  const posPlayed = normalizeString(input.posPlayed).toUpperCase();
  if (POSITIONS.has(posPlayed)) out.posPlayed = posPlayed;

  const scoreFor = toInteger(input.scoreFor);
  if (typeof scoreFor === 'number') out.scoreFor = clamp(scoreFor, 0, 30);

  const scoreAgainst = toInteger(input.scoreAgainst);
  if (typeof scoreAgainst === 'number') out.scoreAgainst = clamp(scoreAgainst, 0, 30);

  const minutesPlayed = toInteger(input.minutesPlayed);
  if (typeof minutesPlayed === 'number') out.minutesPlayed = clamp(minutesPlayed, 0, 130);

  const matchRating = toNumber(input.matchRating);
  if (typeof matchRating === 'number') out.matchRating = clamp(matchRating, 0, 10);

  const goals = toInteger(input.goals);
  if (typeof goals === 'number') out.goals = clamp(goals, 0, 15);

  const assists = toInteger(input.assists);
  if (typeof assists === 'number') out.assists = clamp(assists, 0, 15);

  const shots = toInteger(input.shots);
  if (typeof shots === 'number') out.shots = clamp(shots, 0, 60);

  const shotsOnTarget = toInteger(input.shotsOnTarget);
  if (typeof shotsOnTarget === 'number') out.shotsOnTarget = clamp(shotsOnTarget, 0, 60);

  const xG = toNumber(input.xG);
  if (typeof xG === 'number') out.xG = clamp(xG, 0, 10);

  const keyPasses = toInteger(input.keyPasses);
  if (typeof keyPasses === 'number') out.keyPasses = clamp(keyPasses, 0, 50);

  const chancesCreated = toInteger(input.chancesCreated);
  if (typeof chancesCreated === 'number') out.chancesCreated = clamp(chancesCreated, 0, 50);

  const dribblesAttempted = toInteger(input.dribblesAttempted);
  if (typeof dribblesAttempted === 'number') out.dribblesAttempted = clamp(dribblesAttempted, 0, 80);

  const dribblesCompleted = toInteger(input.dribblesCompleted);
  if (typeof dribblesCompleted === 'number') out.dribblesCompleted = clamp(dribblesCompleted, 0, 80);

  const passAccuracy = toNumber(input.passAccuracy);
  if (typeof passAccuracy === 'number') out.passAccuracy = clamp(passAccuracy, 0, 100);

  const crossAccuracy = toNumber(input.crossAccuracy);
  if (typeof crossAccuracy === 'number') out.crossAccuracy = clamp(crossAccuracy, 0, 100);

  const motm = toBoolean(input.motm);
  if (typeof motm === 'boolean') out.motm = motm;

  const clutchMoment = toBoolean(input.clutchMoment);
  if (typeof clutchMoment === 'boolean') out.clutchMoment = clutchMoment;

  const objectivesCompleted = toBoolean(input.objectivesCompleted);
  if (typeof objectivesCompleted === 'boolean') out.objectivesCompleted = objectivesCompleted;

  const objectivesNotes = normalizeString(input.objectivesNotes);
  if (objectivesNotes) out.objectivesNotes = objectivesNotes;

  const opponentStrength = toInteger(input.opponentStrength);
  if (typeof opponentStrength === 'number') out.opponentStrength = clamp(opponentStrength, 1, 5);

  const ovrAfter = normalizeString(input.ovrAfter);
  if (ovrAfter === '') out.ovrAfter = '';
  else {
    const ovrNum = toInteger(input.ovrAfter);
    if (typeof ovrNum === 'number') out.ovrAfter = clamp(ovrNum, 40, 99);
  }

  const spAfter = normalizeString(input.spAfter);
  if (spAfter === '') out.spAfter = '';
  else {
    const spNum = toInteger(input.spAfter);
    if (typeof spNum === 'number') out.spAfter = clamp(spNum, 0, 200);
  }

  const trust = normalizeString(input.trust);
  if (TRUST_LEVELS.has(trust)) out.trust = trust;

  const notes = normalizeString(input.notes);
  if (notes) out.notes = notes;

  return out;
}

function sanitizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeString(item)).filter(Boolean);
}

async function listMatches(userId, careerId, query) {
  await assertCareerOwnership(careerId, userId);
  const { page, limit, skip } = parsePagination(query);

  const where = { careerId };
  if (query.competition) where.competition = query.competition;
  if (query.posPlayed) where.posPlayed = query.posPlayed;
  if (query.dateFrom || query.dateTo) {
    where.matchDate = {};
    if (query.dateFrom) where.matchDate.gte = query.dateFrom;
    if (query.dateTo) where.matchDate.lte = query.dateTo;
  }
  if (query.pinnedOnly === true) where.pinned = true;
  if (query.search) {
    where.OR = [
      { opponent: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([repo.list(where, skip, limit), repo.count(where)]);

  return {
    items: rows.map(toFrontendMatch),
    meta: buildMeta(total, page, limit),
  };
}

async function createMatch(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.create({
    careerId,
    ...toDbPayload(input),
  });
  return toFrontendMatch(row);
}

async function getMatch(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.findByCareerAndId(careerId, id);
  if (!row) throw new AppError('Match not found', 404, 'NOT_FOUND');
  return toFrontendMatch(row);
}

async function updateMatch(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const found = await repo.findByCareerAndId(careerId, id);
  if (!found) throw new AppError('Match not found', 404, 'NOT_FOUND');

  const row = await repo.update(id, toDbPayload(input));
  return toFrontendMatch(row);
}

async function deleteMatch(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const found = await repo.findByCareerAndId(careerId, id);
  if (!found) throw new AppError('Match not found', 404, 'NOT_FOUND');
  await removeFileIfExists(found.performanceImageUrl);
  await repo.remove(id);
}

async function togglePin(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const found = await repo.findByCareerAndId(careerId, id);
  if (!found) throw new AppError('Match not found', 404, 'NOT_FOUND');
  const row = await repo.update(id, { pinned: !found.pinned });
  return toFrontendMatch(row);
}

async function uploadPerformanceImage(userId, careerId, id, filePath) {
  await assertCareerOwnership(careerId, userId);
  if (!filePath) throw new AppError('Image file is required', 400, 'BAD_REQUEST');

  const found = await repo.findByCareerAndId(careerId, id);
  if (!found) throw new AppError('Match not found', 404, 'NOT_FOUND');

  const performanceImageUrl = toPublicUploadPath(filePath);
  const row = await repo.update(id, { performanceImageUrl });

  if (found.performanceImageUrl && found.performanceImageUrl !== performanceImageUrl) {
    await removeFileIfExists(found.performanceImageUrl);
  }

  return toFrontendMatch(row);
}

async function deletePerformanceImage(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const found = await repo.findByCareerAndId(careerId, id);
  if (!found) throw new AppError('Match not found', 404, 'NOT_FOUND');
  if (!found.performanceImageUrl) return toFrontendMatch(found);

  await removeFileIfExists(found.performanceImageUrl);
  const row = await repo.update(id, { performanceImageUrl: null });
  return toFrontendMatch(row);
}

async function analyzePerformance(userId, careerId, files) {
  await assertCareerOwnership(careerId, userId);
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError('At least one image is required', 400, 'BAD_REQUEST');
  }

  const raw = await ai.analyzeWithAI(files);
  const suggestedRaw =
    raw && typeof raw === 'object' && raw.suggested && typeof raw.suggested === 'object'
      ? raw.suggested
      : raw;
  const suggested = sanitizeSuggestedMatchFields(suggestedRaw);

  if (Object.keys(suggested).length === 0) {
    throw new AppError('No match details could be extracted from image(s)', 422, 'ANALYSIS_EMPTY');
  }

  const confidenceValue = toNumber(raw?.confidence);
  const confidence =
    typeof confidenceValue === 'number' ? clamp(confidenceValue, 0, 1) : null;

  return {
    suggested,
    confidence,
    missingFields: sanitizeStringList(raw?.missingFields),
    warnings: sanitizeStringList(raw?.warnings),
    summary: normalizeString(raw?.summary),
  };
}

module.exports = {
  listMatches,
  createMatch,
  getMatch,
  updateMatch,
  deleteMatch,
  togglePin,
  uploadPerformanceImage,
  deletePerformanceImage,
  analyzePerformance,
};
