const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error');
const repo = require('./careers.repository');
const ai = require('./careers.ai');

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

function sum(items, fn) {
  return items.reduce((acc, item) => acc + fn(item), 0);
}

function toDateSortKey(item) {
  return `${item.matchDate || ''}#${item.createdAt ? new Date(item.createdAt).toISOString() : ''}`;
}

function sortMatchesByDateAsc(matches) {
  return [...matches].sort((a, b) => toDateSortKey(a).localeCompare(toDateSortKey(b)));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asTextList(value, maxItems = 6) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, maxItems);
}

function buildInsightsContext(career, recentMatchesCount) {
  const allMatches = sortMatchesByDateAsc(safeArray(career.matches));
  const recentMatches = allMatches.slice(-recentMatchesCount);
  const last5 = allMatches.slice(-5);

  const totalGoals = sum(allMatches, (m) => Number(m.goals || 0));
  const totalAssists = sum(allMatches, (m) => Number(m.assists || 0));
  const totalGA = totalGoals + totalAssists;
  const totalMinutes = sum(allMatches, (m) => Number(m.minutesPlayed || 0));
  const ratings = allMatches.map((m) => Number(m.matchRating || 0));
  const avgRating = ratings.length ? sum(ratings, (v) => v) / ratings.length : 0;

  const wins = allMatches.filter((m) => Number(m.scoreFor || 0) > Number(m.scoreAgainst || 0)).length;
  const draws = allMatches.filter((m) => Number(m.scoreFor || 0) === Number(m.scoreAgainst || 0)).length;
  const losses = allMatches.length - wins - draws;

  const last5AvgRating = last5.length
    ? sum(last5, (m) => Number(m.matchRating || 0)) / last5.length
    : 0;
  const last5GA = sum(last5, (m) => Number(m.goals || 0) + Number(m.assists || 0));

  const trustCounts = allMatches.reduce(
    (acc, m) => {
      const key = m.trust || 'Medium';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { Full: 0, High: 0, Medium: 0, Low: 0 },
  );

  return {
    career: {
      playerName: career.playerName,
      club: career.club,
      season: career.season,
      primaryPos: career.primaryPos,
      secondaryPos: career.secondaryPos,
      archetype: career.archetype,
      ovr: career.ovr,
      spAvailable: career.spAvailable,
      preferredFoot: career.preferredFoot,
    },
    totals: {
      matches: allMatches.length,
      goals: totalGoals,
      assists: totalAssists,
      ga: totalGA,
      gaPer90: totalMinutes > 0 ? (totalGA / totalMinutes) * 90 : 0,
      avgRating,
      wins,
      draws,
      losses,
      winRate: allMatches.length ? (wins / allMatches.length) * 100 : 0,
      motm: allMatches.filter((m) => !!m.motm).length,
      clutchMoments: allMatches.filter((m) => !!m.clutchMoment).length,
      hatTricks: allMatches.filter((m) => Number(m.goals || 0) >= 3).length,
    },
    recentWindow: {
      count: recentMatches.length,
      last5AvgRating,
      last5GA,
      trustCounts,
      recentMatches: recentMatches.map((m) => ({
        matchDate: m.matchDate,
        competition: m.competition,
        stage: m.stage,
        opponent: m.opponent,
        posPlayed: m.posPlayed,
        scoreFor: m.scoreFor,
        scoreAgainst: m.scoreAgainst,
        minutesPlayed: m.minutesPlayed,
        matchRating: m.matchRating,
        goals: m.goals,
        assists: m.assists,
        xG: m.xG,
        keyPasses: m.keyPasses,
        chancesCreated: m.chancesCreated,
        trust: m.trust,
        motm: m.motm,
        clutchMoment: m.clutchMoment,
      })),
    },
    modules: {
      trophies: safeArray(career.trophies).map((t) => ({ name: t.name, season: t.season, competition: t.competition })).slice(-12),
      challenges: safeArray(career.challenges).map((c) => ({
        label: c.label,
        current: c.current,
        target: c.target,
        completed: c.completed,
        season: c.season,
      })),
      narrativeTags: safeArray(career.narrativeTags).map((n) => n.tag).slice(-20),
      skillSpendsCount: safeArray(career.skillSpends).length,
      attributeTargets: safeArray(career.attributeTargets).map((a) => ({
        attribute: a.attribute,
        currentValue: a.currentValue,
        targetValue: a.targetValue,
        achieved: a.achieved,
      })),
      trainingLogs: safeArray(career.trainingLogs).map((t) => ({
        week: t.week,
        grade: t.grade,
        xpGained: t.xpGained,
      })).slice(-12),
      offers: safeArray(career.offers).map((o) => ({
        club: o.club,
        role: o.role,
        status: o.status,
        score: o.score,
        hasUCL: o.hasUCL,
      })).slice(-12),
      contracts: safeArray(career.contracts).map((c) => ({
        club: c.club,
        startSeason: c.startSeason,
        endSeason: c.endSeason,
        apps: c.apps,
        goals: c.goals,
        assists: c.assists,
      })),
      injuries: safeArray(career.injuries).map((i) => ({
        type: i.type,
        matchesMissed: i.matchesMissed,
        startDate: i.startDate,
      })).slice(-12),
      suspensions: safeArray(career.suspensions).map((s) => ({
        type: s.type,
        competition: s.competition,
        matchesMissed: s.matchesMissed,
        date: s.date,
      })).slice(-12),
      pressNotes: safeArray(career.pressNotes).map((p) => ({
        month: p.month,
        tag: p.tag,
        content: p.content,
      })).slice(-15),
      achievements: safeArray(career.achievements).map((a) => ({
        key: a.key,
        label: a.label,
        unlockedAt: a.unlockedAt,
      })),
      counts: {
        trophies: safeArray(career.trophies).length,
        challenges: safeArray(career.challenges).length,
        narrativeTags: safeArray(career.narrativeTags).length,
        skillSpends: safeArray(career.skillSpends).length,
        attributeTargets: safeArray(career.attributeTargets).length,
        trainingLogs: safeArray(career.trainingLogs).length,
        offers: safeArray(career.offers).length,
        contracts: safeArray(career.contracts).length,
        agentNotes: safeArray(career.agentNotes).length,
        injuries: safeArray(career.injuries).length,
        suspensions: safeArray(career.suspensions).length,
        pressNotes: safeArray(career.pressNotes).length,
        achievements: safeArray(career.achievements).length,
      },
    },
  };
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

async function getPerformanceInsights(userId, id, options = {}) {
  const requested = Number(options.recentMatches || 8);
  const recentMatchesCount = clamp(Number.isFinite(requested) ? requested : 8, 3, 20);

  const career = await repo.getCareerInsightsData(userId, id);
  if (!career) throw new AppError('Career not found', 404, 'NOT_FOUND');

  const context = buildInsightsContext(career, recentMatchesCount);
  const raw = await ai.analyzeCareerContext(context);

  const recommendations = raw && typeof raw.recommendations === 'object' && raw.recommendations
    ? raw.recommendations
    : {};

  return {
    summary: typeof raw?.summary === 'string' ? raw.summary.trim() : '',
    momentum: ['improving', 'stable', 'declining'].includes(raw?.momentum) ? raw.momentum : 'stable',
    confidence: Number.isFinite(Number(raw?.confidence)) ? clamp(Number(raw.confidence), 0, 1) : null,
    strengths: asTextList(raw?.strengths, 8),
    concerns: asTextList(raw?.concerns, 8),
    recommendations: {
      nextMatch: asTextList(recommendations.nextMatch, 6),
      training: asTextList(recommendations.training, 6),
      season: asTextList(recommendations.season, 6),
      transfers: asTextList(recommendations.transfers, 6),
    },
    keyMetricsToWatch: asTextList(raw?.keyMetricsToWatch, 8),
    recentFormSnapshot: typeof raw?.recentFormSnapshot === 'string' ? raw.recentFormSnapshot.trim() : '',
    recentMatchesConsidered: context.recentWindow.count,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  listCareers,
  createCareer,
  getCareer,
  updateCareer,
  deleteCareer,
  activateCareer,
  getPerformanceInsights,
};
