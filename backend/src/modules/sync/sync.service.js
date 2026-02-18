const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error');
const {
  stageToEnum,
  enumToStage,
  skillCategoryToEnum,
  enumToSkillCategory,
  emptyStringToNull,
  nullToEmptyString,
} = require('../../utils/helpers');

const APP_VERSION = '2.0.0';

function toIso(value) {
  return value ? value.toISOString() : undefined;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function importCareer(userId, input) {
  if (!input.career) {
    throw new AppError('career object is required for import', 400, 'BAD_REQUEST');
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const career = await tx.career.create({
        data: {
          userId,
          saveName: input.saveName,
          playerName: input.career.playerName,
          nationality: input.career.nationality,
          archetype: input.career.archetype,
          primaryPos: input.career.primaryPos,
          secondaryPos: input.career.secondaryPos || null,
          club: input.career.club,
          season: input.career.season,
          ovr: input.career.ovr,
          spAvailable: input.career.spAvailable,
          height: input.career.height,
          weight: input.career.weight,
          preferredFoot: input.career.preferredFoot,
          weakFootStars: input.career.weakFootStars,
          skillMoves: input.career.skillMoves,
          badgeUrl: input.career.badgeUrl || null,
          flagUrl: input.career.flagUrl || null,
          profileUpdatedAt: input.career.updatedAt ? new Date(input.career.updatedAt) : null,
        },
      });

      const matches = safeArray(input.matches);
      const trophies = safeArray(input.trophies);
      const challenges = safeArray(input.challenges);
      const narrativeTags = safeArray(input.narrativeTags);
      const skillSpends = safeArray(input.skillSpends);
      const attributeTargets = safeArray(input.attributeTargets);
      const trainingLogs = safeArray(input.trainingLogs);
      const offers = safeArray(input.offers);
      const contracts = safeArray(input.contracts);
      const agentNotes = safeArray(input.agentNotes);
      const injuries = safeArray(input.injuries);
      const suspensions = safeArray(input.suspensions);
      const pressNotes = safeArray(input.pressNotes);
      const achievements = safeArray(input.achievements);

      const [
        matchRes,
        trophyRes,
        challengeRes,
        tagRes,
        skillRes,
        attributeRes,
        trainingRes,
        offerRes,
        contractRes,
        agentRes,
        injuryRes,
        suspensionRes,
        pressRes,
        achievementRes,
      ] = await Promise.all([
        matches.length
          ? tx.match.createMany({
              data: matches.map((m) => ({
                careerId: career.id,
                competition: m.competition,
                stage: stageToEnum(m.stage),
                matchDate: m.matchDate,
                opponent: m.opponent,
                posPlayed: m.posPlayed,
                scoreFor: m.scoreFor,
                scoreAgainst: m.scoreAgainst,
                minutesPlayed: m.minutesPlayed,
                matchRating: m.matchRating,
                goals: m.goals,
                assists: m.assists,
                shots: m.shots,
                shotsOnTarget: m.shotsOnTarget,
                xG: m.xG,
                keyPasses: m.keyPasses,
                chancesCreated: m.chancesCreated,
                dribblesAttempted: m.dribblesAttempted,
                dribblesCompleted: m.dribblesCompleted,
                passAccuracy: m.passAccuracy,
                crossAccuracy: m.crossAccuracy,
                motm: m.motm,
                clutchMoment: m.clutchMoment,
                objectivesCompleted: m.objectivesCompleted,
                objectivesNotes: m.objectivesNotes,
                opponentStrength: m.opponentStrength,
                ovrAfter: emptyStringToNull(m.ovrAfter),
                spAfter: emptyStringToNull(m.spAfter),
                trust: m.trust,
                notes: m.notes,
                performanceImageUrl: m.performanceImageUrl || null,
                pinned: m.pinned,
                ...(m.createdAt ? { createdAt: new Date(m.createdAt) } : {}),
                ...(m.updatedAt ? { updatedAt: new Date(m.updatedAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        trophies.length
          ? tx.trophy.createMany({
              data: trophies.map((t) => ({ careerId: career.id, ...t })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        challenges.length
          ? tx.seasonChallenge.createMany({
              data: challenges.map((c) => ({ careerId: career.id, ...c })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        narrativeTags.length
          ? tx.narrativeTag.createMany({
              data: narrativeTags.map((n) => ({
                careerId: career.id,
                season: n.season,
                tag: n.tag,
                ...(n.createdAt ? { createdAt: new Date(n.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        skillSpends.length
          ? tx.skillSpend.createMany({
              data: skillSpends.map((s) => ({
                careerId: career.id,
                date: s.date,
                pointsSpent: s.pointsSpent,
                category: skillCategoryToEnum(s.category),
                attributeTarget: s.attributeTarget,
                fromValue: s.fromValue,
                toValue: s.toValue,
                notes: s.notes,
                ...(s.createdAt ? { createdAt: new Date(s.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        attributeTargets.length
          ? tx.attributeTarget.createMany({
              data: attributeTargets.map((a) => ({ careerId: career.id, ...a })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        trainingLogs.length
          ? tx.trainingLog.createMany({
              data: trainingLogs.map((t) => ({
                careerId: career.id,
                week: t.week,
                drills: t.drills,
                grade: t.grade,
                xpGained: t.xpGained,
                notes: t.notes,
                ...(t.createdAt ? { createdAt: new Date(t.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        offers.length
          ? tx.transferOffer.createMany({
              data: offers.map((o) => ({
                careerId: career.id,
                club: o.club,
                league: o.league,
                country: o.country,
                role: o.role,
                wage: o.wage,
                fee: o.fee,
                hasUCL: o.hasUCL,
                status: o.status,
                receivedDate: o.receivedDate,
                decisionDate: o.decisionDate || null,
                notes: o.notes,
                score: o.score,
                ...(o.createdAt ? { createdAt: new Date(o.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        contracts.length
          ? tx.contract.createMany({
              data: contracts.map((c) => ({ careerId: career.id, ...c })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        agentNotes.length
          ? tx.agentNote.createMany({
              data: agentNotes.map((n) => ({
                careerId: career.id,
                date: n.date,
                content: n.content,
                tag: n.tag,
                ...(n.createdAt ? { createdAt: new Date(n.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        injuries.length
          ? tx.injuryLog.createMany({
              data: injuries.map((i) => ({
                careerId: career.id,
                type: i.type,
                startDate: i.startDate,
                returnDate: i.returnDate || null,
                matchesMissed: i.matchesMissed,
                notes: i.notes,
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        suspensions.length
          ? tx.suspension.createMany({
              data: suspensions.map((s) => ({
                careerId: career.id,
                type: s.type,
                matchesMissed: s.matchesMissed,
                competition: s.competition,
                date: s.date,
                notes: s.notes,
                ...(s.createdAt ? { createdAt: new Date(s.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        pressNotes.length
          ? tx.pressNote.createMany({
              data: pressNotes.map((p) => ({
                careerId: career.id,
                month: p.month,
                content: p.content,
                tag: p.tag || null,
                ...(p.createdAt ? { createdAt: new Date(p.createdAt) } : {}),
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
        achievements.length
          ? tx.achievement.createMany({
              data: achievements.map((a) => ({
                careerId: career.id,
                key: a.key,
                label: a.label,
                description: a.description,
                icon: a.icon,
                unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : null,
              })),
              skipDuplicates: true,
            })
          : Promise.resolve({ count: 0 }),
      ]);

      if (input.archetypeStage) {
        await tx.archetypeStage.create({
          data: {
            careerId: career.id,
            archetype: input.archetypeStage.archetype,
            stage: input.archetypeStage.stage,
            currentPerks: input.archetypeStage.currentPerks,
            nextUnlock: input.archetypeStage.nextUnlock,
            checklist: input.archetypeStage.checklist,
          },
        });
      }

      return {
        careerId: career.id,
        counts: {
          matches: matchRes.count,
          trophies: trophyRes.count,
          challenges: challengeRes.count,
          narrativeTags: tagRes.count,
          skillSpends: skillRes.count,
          attributeTargets: attributeRes.count,
          archetypeStage: input.archetypeStage ? 1 : 0,
          trainingLogs: trainingRes.count,
          offers: offerRes.count,
          contracts: contractRes.count,
          agentNotes: agentRes.count,
          injuries: injuryRes.count,
          suspensions: suspensionRes.count,
          pressNotes: pressRes.count,
          achievements: achievementRes.count,
        },
      };
    },
    { timeout: 30000 },
  );

  return result;
}

async function exportCareer(userId, careerId) {
  const data = await prisma.career.findFirst({
    where: { id: careerId, userId },
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

  if (!data) {
    throw new AppError('Career not found', 404, 'NOT_FOUND');
  }

  return {
    career: {
      playerName: data.playerName,
      nationality: data.nationality,
      archetype: data.archetype,
      primaryPos: data.primaryPos,
      secondaryPos: data.secondaryPos || undefined,
      club: data.club,
      season: data.season,
      ovr: data.ovr,
      spAvailable: data.spAvailable,
      height: data.height,
      weight: data.weight,
      preferredFoot: data.preferredFoot,
      weakFootStars: data.weakFootStars,
      skillMoves: data.skillMoves,
      badgeUrl: data.badgeUrl || undefined,
      flagUrl: data.flagUrl || undefined,
      updatedAt: toIso(data.profileUpdatedAt || data.updatedAt),
    },
    matches: data.matches.map((m) => ({
      id: m.id,
      competition: m.competition,
      stage: enumToStage(m.stage),
      matchDate: m.matchDate,
      opponent: m.opponent,
      posPlayed: m.posPlayed,
      scoreFor: m.scoreFor,
      scoreAgainst: m.scoreAgainst,
      minutesPlayed: m.minutesPlayed,
      matchRating: m.matchRating,
      goals: m.goals,
      assists: m.assists,
      shots: m.shots,
      shotsOnTarget: m.shotsOnTarget,
      xG: m.xG,
      keyPasses: m.keyPasses,
      chancesCreated: m.chancesCreated,
      dribblesAttempted: m.dribblesAttempted,
      dribblesCompleted: m.dribblesCompleted,
      passAccuracy: m.passAccuracy,
      crossAccuracy: m.crossAccuracy,
      motm: m.motm,
      clutchMoment: m.clutchMoment,
      objectivesCompleted: m.objectivesCompleted,
      objectivesNotes: m.objectivesNotes,
      opponentStrength: m.opponentStrength,
      ovrAfter: nullToEmptyString(m.ovrAfter),
      spAfter: nullToEmptyString(m.spAfter),
      trust: m.trust,
      notes: m.notes,
      performanceImageUrl: m.performanceImageUrl || undefined,
      pinned: m.pinned,
      createdAt: toIso(m.createdAt),
      updatedAt: toIso(m.updatedAt),
    })),
    trophies: data.trophies.map((t) => ({
      id: t.id,
      name: t.name,
      competition: t.competition,
      season: t.season,
      date: t.date,
    })),
    challenges: data.challenges.map((c) => ({
      id: c.id,
      season: c.season,
      label: c.label,
      target: c.target,
      current: c.current,
      unit: c.unit,
      completed: c.completed,
    })),
    narrativeTags: data.narrativeTags.map((n) => ({
      id: n.id,
      season: n.season,
      tag: n.tag,
      createdAt: toIso(n.createdAt),
    })),
    skillSpends: data.skillSpends.map((s) => ({
      id: s.id,
      date: s.date,
      pointsSpent: s.pointsSpent,
      category: enumToSkillCategory(s.category),
      attributeTarget: s.attributeTarget,
      fromValue: s.fromValue,
      toValue: s.toValue,
      notes: s.notes,
      createdAt: toIso(s.createdAt),
    })),
    attributeTargets: data.attributeTargets.map((a) => ({
      id: a.id,
      attribute: a.attribute,
      currentValue: a.currentValue,
      targetValue: a.targetValue,
      deadline: a.deadline,
      achieved: a.achieved,
      notes: a.notes,
    })),
    archetypeStage: data.archetypeStage
      ? {
          archetype: data.archetypeStage.archetype,
          stage: data.archetypeStage.stage,
          currentPerks: data.archetypeStage.currentPerks,
          nextUnlock: data.archetypeStage.nextUnlock,
          checklist: data.archetypeStage.checklist,
        }
      : null,
    trainingLogs: data.trainingLogs.map((t) => ({
      id: t.id,
      week: t.week,
      drills: t.drills,
      grade: t.grade,
      xpGained: t.xpGained,
      notes: t.notes,
      createdAt: toIso(t.createdAt),
    })),
    offers: data.offers.map((o) => ({
      id: o.id,
      club: o.club,
      league: o.league,
      country: o.country,
      role: o.role,
      wage: o.wage,
      fee: o.fee,
      hasUCL: o.hasUCL,
      status: o.status,
      receivedDate: o.receivedDate,
      decisionDate: o.decisionDate || undefined,
      notes: o.notes,
      score: o.score || undefined,
      createdAt: toIso(o.createdAt),
    })),
    contracts: data.contracts.map((c) => ({
      id: c.id,
      club: c.club,
      league: c.league,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      apps: c.apps,
      goals: c.goals,
      assists: c.assists,
      avgRating: c.avgRating,
      trophies: c.trophies,
      notes: c.notes,
    })),
    agentNotes: data.agentNotes.map((a) => ({
      id: a.id,
      date: a.date,
      content: a.content,
      tag: a.tag,
      createdAt: toIso(a.createdAt),
    })),
    injuries: data.injuries.map((i) => ({
      id: i.id,
      type: i.type,
      startDate: i.startDate,
      returnDate: i.returnDate || undefined,
      matchesMissed: i.matchesMissed,
      notes: i.notes,
    })),
    suspensions: data.suspensions.map((s) => ({
      id: s.id,
      type: s.type,
      matchesMissed: s.matchesMissed,
      competition: s.competition,
      date: s.date,
      notes: s.notes,
    })),
    pressNotes: data.pressNotes.map((p) => ({
      id: p.id,
      month: p.month,
      content: p.content,
      tag: p.tag || undefined,
      createdAt: toIso(p.createdAt),
    })),
    achievements: data.achievements.map((a) => ({
      id: a.id,
      key: a.key,
      label: a.label,
      description: a.description,
      icon: a.icon,
      unlockedAt: toIso(a.unlockedAt),
    })),
    exportedAt: new Date().toISOString(),
    version: APP_VERSION,
  };
}

module.exports = {
  importCareer,
  exportCareer,
};
