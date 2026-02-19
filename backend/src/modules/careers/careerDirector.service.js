const { randomUUID, createHash } = require("crypto");
const config = require("../../config/env");
const { AppError } = require("../../middlewares/error");
const repo = require("./careers.repository");
const { runJsonPrompt } = require("../../services/ai/geminiClient");
const { reportSchema, chatSchema } = require("./careerDirector.schema");

const REPORT_PROMPT_VERSION = 3;
const CHAT_PROMPT_VERSION = 3;
const REPORT_EVENTS_LOOKBACK = 500;

const ADVANCED_FIELDS = [
  "shots",
  "shotsOnTarget",
  "xG",
  "keyPasses",
  "chancesCreated",
  "dribblesAttempted",
  "dribblesCompleted",
  "passAccuracy",
  "crossAccuracy",
];

function round(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function safeIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function sortByDateAsc(items = [], selector = () => null) {
  return [...items].sort((a, b) => {
    const ta = safeIso(selector(a)) || "";
    const tb = safeIso(selector(b)) || "";
    return ta.localeCompare(tb);
  });
}

function average(values) {
  if (!Array.isArray(values) || !values.length) return 0;
  return (
    values.reduce((sum, value) => sum + toNumber(value), 0) / values.length
  );
}

function stdDev(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => {
      const delta = toNumber(value) - mean;
      return sum + delta * delta;
    }, 0) / values.length;
  return Math.sqrt(variance);
}

function computeDroughtStreak(matches) {
  let streak = 0;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const m = matches[i];
    const contributions = toNumber(m.goals) + toNumber(m.assists);
    if (contributions > 0) break;
    streak += 1;
  }
  return streak;
}

function toMidnightUtcIso(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function stableStringify(value) {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => (entry === undefined ? "null" : stableStringify(entry))).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort();
    const entries = keys.map(
      (key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`,
    );
    return `{${entries.join(",")}}`;
  }
  return "null";
}

function hashSha256(value) {
  return createHash("sha256")
    .update(String(value || ""))
    .digest("hex");
}

function percentileClamp(value, baseline = 0, span = 1) {
  if (!Number.isFinite(value)) return 0;
  return clamp((value - baseline) / span, 0, 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sortMatchesByDateAsc(matches) {
  return [...matches].sort((a, b) => {
    const da = `${a.matchDate || ""}#${a.createdAt ? new Date(a.createdAt).toISOString() : ""}`;
    const db = `${b.matchDate || ""}#${b.createdAt ? new Date(b.createdAt).toISOString() : ""}`;
    return da.localeCompare(db);
  });
}

function isUnknownAdvancedMatch(match) {
  const values = ADVANCED_FIELDS.map((field) => toNumber(match[field]));
  const allZero = values.every((n) => n === 0);
  return allZero;
}

function buildAdvancedUnknownMap(matches) {
  const map = new Map();
  for (const match of matches) {
    map.set(match.id, isUnknownAdvancedMatch(match));
  }
  return map;
}

function trackedOrUnknown(match, field, unknownAdvancedMap) {
  if (ADVANCED_FIELDS.includes(field)) {
    if (unknownAdvancedMap.get(match.id) && toNumber(match[field]) === 0)
      return "Not tracked";
  }
  return match[field];
}

function aggregateMatches(matches) {
  const apps = matches.length;
  const goals = matches.reduce((sum, m) => sum + toNumber(m.goals), 0);
  const assists = matches.reduce((sum, m) => sum + toNumber(m.assists), 0);
  const minutes = matches.reduce(
    (sum, m) => sum + toNumber(m.minutesPlayed),
    0,
  );
  const ratings = matches
    .map((m) => toNumber(m.matchRating))
    .filter((n) => n > 0);
  const wins = matches.filter(
    (m) => toNumber(m.scoreFor) > toNumber(m.scoreAgainst),
  ).length;
  const draws = matches.filter(
    (m) => toNumber(m.scoreFor) === toNumber(m.scoreAgainst),
  ).length;
  const losses = apps - wins - draws;
  const motm = matches.filter((m) => !!m.motm).length;
  const clutchMoments = matches.filter((m) => !!m.clutchMoment).length;

  return {
    apps,
    goals,
    assists,
    ga: goals + assists,
    minutes,
    gaPer90:
      minutes > 0 ? Number((((goals + assists) / minutes) * 90).toFixed(2)) : 0,
    avgRating: ratings.length
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
      : 0,
    wins,
    draws,
    losses,
    winRate: apps > 0 ? Number(((wins / apps) * 100).toFixed(2)) : 0,
    motm,
    clutchMoments,
  };
}

function buildDataQuality(matches) {
  const flags = [];
  const unknownAdvancedMap = buildAdvancedUnknownMap(matches);
  const unknownAdvancedMatches = matches.filter((m) =>
    unknownAdvancedMap.get(m.id),
  ).length;

  if (matches.length < 5) {
    flags.push("Small sample size: fewer than 5 matches logged.");
  }

  if (unknownAdvancedMatches > 0) {
    flags.push(
      `Advanced performance stats marked Not tracked in ${unknownAdvancedMatches}/${matches.length || 1} matches.`,
    );
  }

  const uclMatches = matches.filter(
    (m) => m.competition === "UCL" || m.competition === "UEL",
  );
  if (uclMatches.length === 0) {
    flags.push(
      "European impact context is Not tracked (no UCL/UEL matches logged).",
    );
  }

  const noTrustCount = matches.filter((m) => !m.trust).length;
  if (noTrustCount > 0) {
    flags.push(`Manager trust is Not tracked in ${noTrustCount} matches.`);
  }

  return {
    flags,
    unknownAdvancedMap,
  };
}

function buildNotableMoments(matches) {
  if (!matches.length) return [];
  const sortedByRating = [...matches].sort(
    (a, b) => toNumber(b.matchRating) - toNumber(a.matchRating),
  );
  const top = sortedByRating[0];
  const low = sortedByRating[sortedByRating.length - 1];
  const hatTricks = matches.filter((m) => toNumber(m.goals) >= 3).slice(-2);
  const clutch = matches.filter((m) => m.clutchMoment).slice(-3);
  const moments = [];

  if (top) {
    moments.push(
      `Top rating: ${toNumber(top.matchRating).toFixed(1)} vs ${top.opponent} (${top.competition}, ${top.matchDate})`,
    );
  }
  if (low) {
    moments.push(
      `Lowest rating: ${toNumber(low.matchRating).toFixed(1)} vs ${low.opponent} (${low.competition}, ${low.matchDate})`,
    );
  }
  for (const m of hatTricks) {
    moments.push(
      `Hat-trick alert: ${m.goals} goals vs ${m.opponent} (${m.matchDate})`,
    );
  }
  for (const m of clutch) {
    moments.push(`Clutch moment recorded vs ${m.opponent} (${m.matchDate})`);
  }
  return moments.slice(0, 10);
}

function pickContextWindow(matches, options = {}) {
  const wholeCareer = !!options.wholeCareer;
  const recentMatches = clamp(toNumber(options.recentMatches) || 8, 3, 30);
  if (wholeCareer) {
    return {
      mode: "WHOLE_CAREER",
      recentMatches: null,
      matches: matches.slice(-Math.min(24, Math.max(8, matches.length))),
    };
  }
  return {
    mode: "LAST_N",
    recentMatches,
    matches: matches.slice(-recentMatches),
  };
}

function buildContextPack(careerData, options = {}) {
  const allMatches = sortMatchesByDateAsc(
    Array.isArray(careerData.matches) ? careerData.matches : [],
  );
  const window = pickContextWindow(allMatches, options);
  const quality = buildDataQuality(allMatches);

  const windowRows = window.matches.map((m) => ({
    date: m.matchDate,
    competition: m.competition,
    stage: m.stage,
    opponent: m.opponent,
    result: `${toNumber(m.scoreFor)}-${toNumber(m.scoreAgainst)}`,
    minutes: toNumber(m.minutesPlayed),
    position: m.posPlayed,
    rating: toNumber(m.matchRating),
    goals: toNumber(m.goals),
    assists: toNumber(m.assists),
    xG: trackedOrUnknown(m, "xG", quality.unknownAdvancedMap),
    keyPasses: trackedOrUnknown(m, "keyPasses", quality.unknownAdvancedMap),
    chancesCreated: trackedOrUnknown(
      m,
      "chancesCreated",
      quality.unknownAdvancedMap,
    ),
    passAccuracy: trackedOrUnknown(
      m,
      "passAccuracy",
      quality.unknownAdvancedMap,
    ),
    managerTrust: m.trust || "Not tracked",
    clutch: !!m.clutchMoment,
    motm: !!m.motm,
  }));

  const uclSubset = allMatches.filter(
    (m) => m.competition === "UCL" || m.competition === "UEL",
  );
  const domesticSubset = allMatches.filter(
    (m) => m.competition === "League" || m.competition === "Cup",
  );
  const transfers = Array.isArray(careerData.offers) ? careerData.offers : [];
  const contracts = Array.isArray(careerData.contracts)
    ? careerData.contracts
    : [];
  const skillSpends = Array.isArray(careerData.skillSpends)
    ? careerData.skillSpends
    : [];
  const narrativeTags = Array.isArray(careerData.narrativeTags)
    ? careerData.narrativeTags
    : [];
  const pressNotes = Array.isArray(careerData.pressNotes)
    ? careerData.pressNotes
    : [];
  const agentNotes = Array.isArray(careerData.agentNotes)
    ? careerData.agentNotes
    : [];
  const injuries = Array.isArray(careerData.injuries)
    ? careerData.injuries
    : [];
  const suspensions = Array.isArray(careerData.suspensions)
    ? careerData.suspensions
    : [];
  const milestones = Array.isArray(careerData.challenges)
    ? careerData.challenges
    : [];
  const careerTotals = aggregateMatches(allMatches);
  const seasonSummary = aggregateMatches(window.matches);
  const uclSummary = uclSubset.length ? aggregateMatches(uclSubset) : null;
  const domesticSummary = domesticSubset.length
    ? aggregateMatches(domesticSubset)
    : null;
  const deterministicMetrics = buildDeterministicMetrics({
    allMatches,
    windowMatches: window.matches,
    uclSubset,
    domesticSubset,
    careerTotals,
    seasonSummary,
    transferOffers: transfers,
  });

  const promptContext = {
    requestContext: {
      mode: window.mode,
      recentMatches: window.recentMatches,
      tone: options.tone || "Balanced",
      focus: options.focus || "Development",
    },
    careerProfile: {
      playerName: careerData.playerName,
      nationality: careerData.nationality,
      club: careerData.club,
      season: careerData.season,
      archetype: careerData.archetype,
      primaryPos: careerData.primaryPos,
      secondaryPos: careerData.secondaryPos || "Not tracked",
      ovr: careerData.ovr,
      spAvailable: careerData.spAvailable,
    },
    deterministicMetrics,
    careerTotals,
    seasonSummary,
    uclSummary: uclSummary || "Not tracked",
    domesticSummary: domesticSummary || "Not tracked",
    lastMatchesTable: windowRows.slice(-10),
    notableMoments: buildNotableMoments(allMatches).slice(-6),
    transferSignals: {
      totalOffers: transfers.length,
      pendingOffers: transfers.filter(
        (o) => String(o.status || "").toLowerCase() === "pending",
      ).length,
      acceptedOffers: transfers.filter(
        (o) => String(o.status || "").toLowerCase() === "accepted",
      ).length,
      rejectedOffers: transfers.filter(
        (o) => String(o.status || "").toLowerCase() === "rejected",
      ).length,
      topRecentOffers: transfers.slice(-6).map((o) => ({
        club: o.club,
        role: o.role,
        hasUCL: !!o.hasUCL,
        score: typeof o.score === "number" ? o.score : "Not tracked",
        status: o.status,
        receivedDate: o.receivedDate,
      })),
    },
    contracts: contracts.slice(-5).map((c) => ({
      club: c.club,
      league: c.league,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      avgRating: c.avgRating,
      ga: toNumber(c.goals) + toNumber(c.assists),
    })),
    skills: {
      archetypeStage: careerData.archetypeStage
        ? {
            stage: careerData.archetypeStage.stage,
            nextUnlock: careerData.archetypeStage.nextUnlock,
          }
        : "Not tracked",
      recentSpends: skillSpends.slice(-6).map((s) => ({
        date: s.date,
        category: s.category,
        attributeTarget: s.attributeTarget,
        pointsSpent: s.pointsSpent,
      })),
      openTargets: Array.isArray(careerData.attributeTargets)
        ? careerData.attributeTargets
            .filter((t) => !t.achieved)
            .slice(-6)
            .map((t) => ({
              attribute: t.attribute,
              currentValue: t.currentValue,
              targetValue: t.targetValue,
              deadline: t.deadline,
            }))
        : [],
    },
    notesSummary: {
      injuriesRecent: injuries.slice(-5).map((i) => ({
        type: i.type,
        startDate: i.startDate,
        returnDate: i.returnDate || "Not tracked",
        matchesMissed: i.matchesMissed,
      })),
      suspensionsRecent: suspensions.slice(-5).map((s) => ({
        type: s.type,
        competition: s.competition,
        date: s.date,
        matchesMissed: s.matchesMissed,
      })),
      milestones: milestones.slice(-8).map((m) => ({
        label: m.label,
        target: m.target,
        current: m.current,
        unit: m.unit,
        completed: m.completed,
      })),
      narrativeTags: narrativeTags.slice(-10).map((t) => t.tag),
      pressTags: pressNotes
        .slice(-8)
        .map((n) => ({ month: n.month, tag: n.tag || "Other" })),
      agentTags: agentNotes
        .slice(-8)
        .map((n) => ({ date: n.date, tag: n.tag })),
    },
    dataQualityFlags: quality.flags,
    dataQualityMeta: {
      advancedStatsUnknownMatches: allMatches.filter((m) =>
        quality.unknownAdvancedMap.get(m.id),
      ).length,
      totalMatches: allMatches.length,
    },
  };

  return {
    requestContext: {
      mode: window.mode,
      recentMatches: window.recentMatches,
      tone: options.tone || "Balanced",
      focus: options.focus || "Development",
    },
    careerProfile: {
      playerName: careerData.playerName,
      nationality: careerData.nationality,
      club: careerData.club,
      season: careerData.season,
      archetype: careerData.archetype,
      primaryPos: careerData.primaryPos,
      secondaryPos: careerData.secondaryPos || "Not tracked",
      ovr: careerData.ovr,
      spAvailable: careerData.spAvailable,
      preferredFoot: careerData.preferredFoot,
      weakFootStars: careerData.weakFootStars,
      skillMoves: careerData.skillMoves,
      height: careerData.height,
      weight: careerData.weight,
    },
    careerTotals,
    seasonSummary,
    uclSummary: uclSummary || "Not tracked",
    domesticSummary: domesticSummary || "Not tracked",
    lastMatchesTable: windowRows,
    notableMoments: buildNotableMoments(allMatches),
    transferOffers: transfers.slice(-12).map((o) => ({
      club: o.club,
      league: o.league,
      country: o.country,
      role: o.role,
      wage: o.wage || "Not tracked",
      hasUCL: !!o.hasUCL,
      score: typeof o.score === "number" ? o.score : "Not tracked",
      status: o.status,
      receivedDate: o.receivedDate,
    })),
    contracts: contracts.slice(-8).map((c) => ({
      club: c.club,
      league: c.league,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      apps: c.apps,
      goals: c.goals,
      assists: c.assists,
      avgRating: c.avgRating,
    })),
    skills: {
      archetypeStage: careerData.archetypeStage
        ? {
            stage: careerData.archetypeStage.stage,
            nextUnlock: careerData.archetypeStage.nextUnlock,
            checklist: careerData.archetypeStage.checklist,
          }
        : "Not tracked",
      recentSpends: skillSpends.slice(-12).map((s) => ({
        date: s.date,
        category: s.category,
        attributeTarget: s.attributeTarget,
        pointsSpent: s.pointsSpent,
      })),
      targets: Array.isArray(careerData.attributeTargets)
        ? careerData.attributeTargets.slice(-10).map((t) => ({
            attribute: t.attribute,
            currentValue: t.currentValue,
            targetValue: t.targetValue,
            achieved: t.achieved,
            deadline: t.deadline,
          }))
        : [],
    },
    notes: {
      press: pressNotes
        .slice(-10)
        .map((n) => ({
          month: n.month,
          tag: n.tag || "Other",
          content: n.content,
        })),
      agent: agentNotes
        .slice(-10)
        .map((n) => ({ date: n.date, tag: n.tag, content: n.content })),
      injuries: injuries
        .slice(-10)
        .map((i) => ({
          type: i.type,
          startDate: i.startDate,
          returnDate: i.returnDate || "Not tracked",
          matchesMissed: i.matchesMissed,
        })),
      suspensions: suspensions
        .slice(-10)
        .map((s) => ({
          type: s.type,
          competition: s.competition,
          date: s.date,
          matchesMissed: s.matchesMissed,
        })),
      milestones: milestones.slice(-12).map((m) => ({
        label: m.label,
        target: m.target,
        current: m.current,
        unit: m.unit,
        completed: m.completed,
      })),
      narrativeTags: narrativeTags.slice(-14).map((t) => t.tag),
    },
    dataQualityFlags: quality.flags,
    dataQualityMeta: {
      advancedStatsUnknownMatches: allMatches.filter((m) =>
        quality.unknownAdvancedMap.get(m.id),
      ).length,
      totalMatches: allMatches.length,
    },
    deterministicMetrics,
    promptContext,
  };
}

function buildPromptPayload(contextPack) {
  const context = contextPack.promptContext || contextPack;
  const lastMatches = Array.isArray(context.lastMatchesTable)
    ? context.lastMatchesTable
    : [];
  const transferSignals = context.transferSignals || {};
  const skills = context.skills || {};
  const notesSummary = context.notesSummary || {};

  return {
    requestContext: context.requestContext,
    careerProfile: context.careerProfile,
    deterministicMetrics: context.deterministicMetrics,
    scorecards: {
      careerTotals: context.careerTotals,
      seasonSummary: context.seasonSummary,
      uclSummary: context.uclSummary,
      domesticSummary: context.domesticSummary,
    },
    recentEvidence: {
      lastMatches: lastMatches.slice(-6),
      notableMoments: Array.isArray(context.notableMoments)
        ? context.notableMoments.slice(-5)
        : [],
    },
    transferSignals: {
      totalOffers: toNumber(transferSignals.totalOffers),
      pendingOffers: toNumber(transferSignals.pendingOffers),
      acceptedOffers: toNumber(transferSignals.acceptedOffers),
      rejectedOffers: toNumber(transferSignals.rejectedOffers),
      topRecentOffers: Array.isArray(transferSignals.topRecentOffers)
        ? transferSignals.topRecentOffers.slice(-4)
        : [],
    },
    skills: {
      archetypeStage: skills.archetypeStage || "Not tracked",
      recentSpends: Array.isArray(skills.recentSpends)
        ? skills.recentSpends.slice(-4)
        : [],
      openTargets: Array.isArray(skills.openTargets)
        ? skills.openTargets.slice(-4)
        : [],
    },
    notesSummary: {
      injuriesRecent: Array.isArray(notesSummary.injuriesRecent)
        ? notesSummary.injuriesRecent.slice(-3)
        : [],
      suspensionsRecent: Array.isArray(notesSummary.suspensionsRecent)
        ? notesSummary.suspensionsRecent.slice(-3)
        : [],
      milestones: Array.isArray(notesSummary.milestones)
        ? notesSummary.milestones.slice(-6)
        : [],
      narrativeTags: Array.isArray(notesSummary.narrativeTags)
        ? notesSummary.narrativeTags.slice(-6)
        : [],
    },
    dataQualityFlags: Array.isArray(context.dataQualityFlags)
      ? context.dataQualityFlags
      : [],
    dataQualityMeta: context.dataQualityMeta || {},
  };
}

function buildDeterministicMetrics({
  allMatches,
  windowMatches,
  uclSubset,
  domesticSubset,
  careerTotals,
  seasonSummary,
  transferOffers,
}) {
  const appCount = Math.max(1, toNumber(careerTotals.apps));
  const motmRate = toNumber(careerTotals.motm) / appCount;
  const clutchRate = toNumber(careerTotals.clutchMoments) / appCount;
  const reputationScoreRaw =
    percentileClamp(toNumber(careerTotals.gaPer90), 0.2, 1.6) * 42 +
    percentileClamp(toNumber(careerTotals.avgRating), 6.2, 2) * 26 +
    percentileClamp(toNumber(careerTotals.winRate), 35, 50) * 16 +
    percentileClamp(motmRate, 0.04, 0.36) * 10 +
    percentileClamp(clutchRate, 0.03, 0.3) * 6;
  const reputationScore = round(clamp(reputationScoreRaw, 0, 100), 1);

  const uclSummary = uclSubset.length ? aggregateMatches(uclSubset) : null;
  const domesticSummary = domesticSubset.length
    ? aggregateMatches(domesticSubset)
    : null;
  const europeanTracked = !!uclSummary;
  const europeanImpactScore = europeanTracked
    ? round(
        clamp(
          percentileClamp(toNumber(uclSummary.gaPer90), 0.05, 1.4) * 45 +
            percentileClamp(toNumber(uclSummary.avgRating), 6.0, 2.0) * 35 +
            percentileClamp(toNumber(uclSummary.winRate), 20, 60) * 20,
          0,
          100,
        ),
        1,
      )
    : null;

  const recentRatings = windowMatches
    .map((m) => toNumber(m.matchRating))
    .filter((n) => n > 0);
  const formVolatility = round(stdDev(recentRatings), 3);
  const formVolatilityBand =
    formVolatility < 0.35
      ? "stable"
      : formVolatility < 0.75
        ? "mixed"
        : "volatile";
  const droughtMatches = computeDroughtStreak(allMatches);

  const baselineRating = domesticSummary
    ? toNumber(domesticSummary.avgRating)
    : toNumber(careerTotals.avgRating);
  const baselineGaPer90 = domesticSummary
    ? toNumber(domesticSummary.gaPer90)
    : toNumber(careerTotals.gaPer90);
  const uclRatingDelta = europeanTracked
    ? round(baselineRating - toNumber(uclSummary.avgRating), 2)
    : null;
  const uclGaPer90Delta = europeanTracked
    ? round(baselineGaPer90 - toNumber(uclSummary.gaPer90), 2)
    : null;
  const uclUnderperformance = !!(
    europeanTracked &&
    ((uclRatingDelta !== null && uclRatingDelta >= 0.45) ||
      (uclGaPer90Delta !== null && uclGaPer90Delta >= 0.35))
  );

  const pendingOffers = transferOffers.filter(
    (o) => String(o.status || "").toLowerCase() === "pending",
  ).length;
  const acceptedOffers = transferOffers.filter(
    (o) => String(o.status || "").toLowerCase() === "accepted",
  ).length;
  const transferPressureLevel =
    pendingOffers >= 3
      ? "high"
      : pendingOffers >= 1 || acceptedOffers >= 1
        ? "medium"
        : "low";

  return {
    reputationScore,
    europeanImpact: {
      tracked: europeanTracked,
      score: europeanImpactScore,
      uclMatches: uclSubset.length,
      domesticMatches: domesticSubset.length,
    },
    droughtMatches,
    formVolatility,
    formVolatilityBand,
    uclUnderperformance,
    uclDelta: {
      rating: uclRatingDelta,
      gaPer90: uclGaPer90Delta,
    },
    transferPressure: {
      level: transferPressureLevel,
      pendingOffers,
      acceptedOffers,
      totalOffers: transferOffers.length,
    },
    seasonVsCareer: {
      seasonGaPer90: toNumber(seasonSummary.gaPer90),
      careerGaPer90: toNumber(careerTotals.gaPer90),
      seasonAvgRating: toNumber(seasonSummary.avgRating),
      careerAvgRating: toNumber(careerTotals.avgRating),
    },
  };
}

function buildReportFingerprint(careerData, contextPack) {
  const matches = sortByDateAsc(
    Array.isArray(careerData.matches) ? careerData.matches : [],
    (m) => m.matchDate || m.createdAt,
  );
  const offers = sortByDateAsc(
    Array.isArray(careerData.offers) ? careerData.offers : [],
    (o) => o.receivedDate || o.createdAt,
  );
  const contracts = sortByDateAsc(
    Array.isArray(careerData.contracts) ? careerData.contracts : [],
    (c) => c.endSeason || c.createdAt,
  );
  const skillSpends = sortByDateAsc(
    Array.isArray(careerData.skillSpends) ? careerData.skillSpends : [],
    (s) => s.date || s.createdAt,
  );
  const challenges = sortByDateAsc(
    Array.isArray(careerData.challenges) ? careerData.challenges : [],
    (c) => c.updatedAt || c.createdAt,
  );
  const narrativeTags = sortByDateAsc(
    Array.isArray(careerData.narrativeTags) ? careerData.narrativeTags : [],
    (t) => t.createdAt || t.updatedAt,
  );

  const latestMatch = matches[matches.length - 1] || null;
  const latestOffer = offers[offers.length - 1] || null;
  const latestContract = contracts[contracts.length - 1] || null;
  const latestSpend = skillSpends[skillSpends.length - 1] || null;
  const latestChallenge = challenges[challenges.length - 1] || null;
  const latestTag = narrativeTags[narrativeTags.length - 1] || null;

  const fingerprintPayload = {
    version: REPORT_PROMPT_VERSION,
    request: contextPack.requestContext,
    profile: {
      season: careerData.season,
      club: careerData.club,
      ovr: careerData.ovr,
      spAvailable: careerData.spAvailable,
      archetype: careerData.archetype,
      archetypeStage: careerData.archetypeStage?.stage || null,
    },
    counts: {
      matches: matches.length,
      offers: offers.length,
      contracts: contracts.length,
      skillSpends: skillSpends.length,
      challenges: challenges.length,
      narrativeTags: narrativeTags.length,
    },
    latest: {
      match: latestMatch
        ? {
            id: latestMatch.id,
            date: latestMatch.matchDate,
            updatedAt: latestMatch.updatedAt || latestMatch.createdAt,
          }
        : null,
      offer: latestOffer
        ? {
            id: latestOffer.id,
            status: latestOffer.status,
            date: latestOffer.receivedDate || latestOffer.createdAt,
          }
        : null,
      contract: latestContract
        ? {
            id: latestContract.id,
            startSeason: latestContract.startSeason,
            endSeason: latestContract.endSeason,
          }
        : null,
      skillSpend: latestSpend
        ? {
            id: latestSpend.id,
            date: latestSpend.date || latestSpend.createdAt,
            pointsSpent: latestSpend.pointsSpent,
          }
        : null,
      challenge: latestChallenge
        ? {
            id: latestChallenge.id,
            current: latestChallenge.current,
            target: latestChallenge.target,
            completed: latestChallenge.completed,
          }
        : null,
      narrativeTag: latestTag
        ? {
            id: latestTag.id,
            tag: latestTag.tag,
            createdAt: latestTag.createdAt || latestTag.updatedAt,
          }
        : null,
    },
    deterministicMetrics: contextPack.deterministicMetrics,
  };

  return hashSha256(stableStringify(fingerprintPayload));
}

function findCachedReportByFingerprint(rows, fingerprint) {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (row.eventType !== "REPORT") continue;
    const payload = row.payload || {};
    if (payload?.input?.fingerprint === fingerprint) {
      return {
        ...payload,
        cache: {
          ...(payload.cache && typeof payload.cache === "object"
            ? payload.cache
            : {}),
          hit: true,
          fingerprint,
          sourceEventId: row.id || payload.id || null,
          servedAt: new Date().toISOString(),
        },
      };
    }
  }
  return null;
}

function countReportsSince(rows, sinceIso) {
  return rows.filter((row) => {
    if (row.eventType !== "REPORT") return false;
    const ts = safeIso(row.createdAt) || safeIso(row.payload?.createdAt);
    return !!ts && ts >= sinceIso;
  }).length;
}

function findLastChatIso(rows) {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (row.eventType !== "CHAT") continue;
    const payload = row.payload || {};
    const ts =
      safeIso(row.createdAt) ||
      safeIso(payload.createdAt) ||
      safeIso(payload.assistant?.timestamp) ||
      safeIso(payload.user?.timestamp);
    if (ts) return ts;
  }
  return null;
}

function reportSystemInstruction() {
  return [
    "You are Career Director: narrative architect, strict analyst, and accountability coach for an EAFC player-career tracker.",
    "Non-negotiable rules:",
    "1) Use ONLY provided context JSON.",
    "2) Never invent stats or events.",
    '3) If data is missing, say "Not tracked".',
    "4) Keep harsh tone critical but respectful. No insults.",
    "5) Return VALID JSON only that matches the schema.",
  ].join("\n");
}

function buildReportPrompt(contextPack) {
  const promptPayload = buildPromptPayload(contextPack);
  return [
    "Generate a Career Director Report in strict JSON.",
    "Use deterministicMetrics as baseline truth for scoring/volatility and convert those signals into narrative.",
    "Output schema:",
    "{",
    '  "headline": "string",',
    '  "phase": "breakout|consolidation|prime|decline",',
    '  "phaseConfidence": 0.0,',
    '  "reputationScore": { "score": 0, "rationale": "string" },',
    '  "europeanImpactIndex": { "score": 0, "rationale": "string" },',
    '  "pressureBoard": ["3-5 items"],',
    '  "storyline": { "recentArc": "paragraph", "seasonArc": "paragraph", "longArc": "paragraph" },',
    '  "ruthlessTruths": ["exactly 3 bullets"],',
    '  "strengths": ["3-6 bullets"],',
    '  "weaknesses": ["3-6 bullets"],',
    '  "nextMatchMandates": ["exactly 3 measurable targets"],',
    '  "developmentPlan": [{ "allocation": "string", "reason": "string" }],',
    '  "transferOutlook": { "recommendation": "stay|leave|conditional", "rationale": "string", "thresholds": ["items"] },',
    '  "milestonesSuggested": [{ "label": "string", "target": 1, "unit": "string", "rationale": "string", "deadline": "string" }],',
    '  "narrativeTagsSuggested": ["3-6 tags"],',
    '  "agentNotesSuggested": ["1-3 notes"],',
    '  "risks": ["list"],',
    '  "whatToTrackNext": ["list"],',
    '  "dataQualityFlags": ["list"],',
    '  "groundingDataPoints": ["internal data points used"]',
    "}",
    "Grounding constraints:",
    '- Cite internal evidence in groundingDataPoints (examples: "lastMatchesTable", "careerTotals", "transferOffers", "skills.archetypeStage", "notes.injuries").',
    "- Prioritize deterministicMetrics for reputation/european impact/drought/volatility framing.",
    '- When a field is not available, explicitly use "Not tracked" in rationale text.',
    "- milestonesSuggested must contain 1 to 6 realistic items.",
    "- Do not use external football data or game APIs.",
    "",
    `Context JSON: ${JSON.stringify(promptPayload)}`,
  ].join("\n");
}

function chatSystemInstruction() {
  return [
    "You are Career Director chat assistant.",
    "Rules:",
    "1) Use only provided context data and recent conversation.",
    '2) Never invent stats. If absent, say "Not tracked".',
    "3) Tone follows requested tone value.",
    "4) You may ask up to 2 follow-up questions only if critical data is missing.",
    "5) Return JSON only.",
  ].join("\n");
}

function buildChatPrompt(contextPack, message, conversation) {
  const promptPayload = buildPromptPayload(contextPack);
  const compactConversation = Array.isArray(conversation)
    ? conversation.slice(-8).map((entry) => ({
        role: entry.role,
        content: entry.content,
        timestamp: entry.timestamp,
      }))
    : [];

  return [
    "Answer user message with grounded career-director reasoning.",
    "Use deterministicMetrics first, then expand with concise narrative.",
    "Output schema:",
    "{",
    '  "answer": "string",',
    '  "followUpQuestions": ["0-2 items"],',
    '  "dataQualityFlags": ["list"],',
    '  "groundingDataPoints": ["internal data points used"]',
    "}",
    "",
    `Conversation JSON: ${JSON.stringify(compactConversation)}`,
    `Context JSON: ${JSON.stringify(promptPayload)}`,
    `User message: ${String(message || "")}`,
  ].join("\n");
}

async function generateCareerDirectorReport(userId, careerId, input = {}) {
  const career = await repo.getCareerInsightsData(userId, careerId);
  if (!career) throw new AppError("Career not found", 404, "NOT_FOUND");

  const tone = input.tone || "Balanced";
  const focus = input.focus || "Development";
  const contextPack = buildContextPack(career, {
    tone,
    focus,
    recentMatches: input.recentMatches,
    wholeCareer: input.wholeCareer,
  });
  const reportFingerprint = buildReportFingerprint(career, contextPack);
  const historyRows = await repo.listCareerDirectorEvents(
    userId,
    careerId,
    REPORT_EVENTS_LOOKBACK,
  );
  const cached = findCachedReportByFingerprint(historyRows, reportFingerprint);
  if (cached) return cached;

  const dayStartIso = toMidnightUtcIso(new Date());
  const reportsToday = countReportsSince(historyRows, dayStartIso);
  const dailyMax = Number(config.CAREER_DIRECTOR_REPORT_DAILY_MAX) || 3;
  if (reportsToday >= dailyMax) {
    const resetAt = new Date(
      Date.parse(dayStartIso) + 24 * 60 * 60 * 1000,
    ).toISOString();
    throw new AppError(
      `Daily Career Director generation limit reached (${dailyMax} per career).`,
      429,
      "AI_REPORT_DAILY_LIMIT",
      {
        dailyMax,
        reportsToday,
        resetAt,
        dayStart: dayStartIso,
      },
    );
  }

  const parsed = await runJsonPrompt({
    systemInstruction: reportSystemInstruction(),
    prompt: buildReportPrompt(contextPack),
    schema: reportSchema,
    modelPreference: "quality",
    fixPromptSuffix: "Fix JSON only. Keep exact schema keys.",
    maxAttempts: 1,
  });

  const createdAt = new Date().toISOString();
  const stored = {
    id: randomUUID(),
    createdAt,
    input: {
      tone,
      focus,
      recentMatches: contextPack.requestContext.recentMatches,
      wholeCareer: contextPack.requestContext.mode === "WHOLE_CAREER",
      contextWindow: contextPack.requestContext.mode,
      promptVersion: REPORT_PROMPT_VERSION,
      fingerprint: reportFingerprint,
    },
    output: {
      ...parsed,
      dataQualityFlags: parsed.dataQualityFlags.length
        ? parsed.dataQualityFlags
        : contextPack.dataQualityFlags,
    },
    deterministicMetrics: contextPack.deterministicMetrics,
    cache: {
      hit: false,
      fingerprint: reportFingerprint,
    },
  };

  await repo.insertCareerDirectorEvent(userId, careerId, "REPORT", stored);
  return stored;
}

async function chatCareerDirector(userId, careerId, input = {}) {
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!message) throw new AppError("Message is required", 400, "BAD_REQUEST");

  const career = await repo.getCareerInsightsData(userId, careerId);
  if (!career) throw new AppError("Career not found", 404, "NOT_FOUND");

  const tone = input.tone || "Balanced";
  const focus = input.focus || "Development";
  const contextPack = buildContextPack(career, {
    tone,
    focus,
    recentMatches: input.recentMatches,
    wholeCareer: input.wholeCareer,
  });

  const historyRows = await repo.listCareerDirectorEvents(userId, careerId, 80);
  const cooldownMs = Number(config.CAREER_DIRECTOR_CHAT_COOLDOWN_MS) || 0;
  if (cooldownMs > 0) {
    const lastChatIso = findLastChatIso(historyRows);
    if (lastChatIso) {
      const elapsedMs = Date.now() - Date.parse(lastChatIso);
      if (
        Number.isFinite(elapsedMs) &&
        elapsedMs >= 0 &&
        elapsedMs < cooldownMs
      ) {
        const retryAfterMs = cooldownMs - elapsedMs;
        throw new AppError(
          `Please wait ${Math.ceil(retryAfterMs / 1000)}s before sending another chat message.`,
          429,
          "AI_CHAT_COOLDOWN",
          { cooldownMs, retryAfterMs, lastChatAt: lastChatIso },
        );
      }
    }
  }

  const conversation = [];
  for (const row of historyRows) {
    if (row.eventType !== "CHAT") continue;
    const payload = row.payload || {};
    if (payload?.user && typeof payload.user === "object")
      conversation.push(payload.user);
    if (payload?.assistant && typeof payload.assistant === "object")
      conversation.push(payload.assistant);
  }
  const recentConversation = conversation.slice(-12);

  const parsed = await runJsonPrompt({
    systemInstruction: chatSystemInstruction(),
    prompt: buildChatPrompt(contextPack, message, recentConversation),
    schema: chatSchema,
    modelPreference: "fast",
    fixPromptSuffix: "Fix JSON only. Keep exact schema keys.",
    maxAttempts: 1,
  });

  const now = new Date().toISOString();
  const userMessage = {
    role: "user",
    content: message,
    timestamp: now,
    tone,
    focus,
    contextWindow: contextPack.requestContext.mode,
    recentMatches: contextPack.requestContext.recentMatches,
  };
  const assistantMessage = {
    role: "assistant",
    content: parsed.answer,
    followUpQuestions: parsed.followUpQuestions || [],
    dataQualityFlags: parsed.dataQualityFlags?.length
      ? parsed.dataQualityFlags
      : contextPack.dataQualityFlags,
    groundingDataPoints: parsed.groundingDataPoints || [],
    timestamp: now,
    tone,
    focus,
    contextWindow: contextPack.requestContext.mode,
    recentMatches: contextPack.requestContext.recentMatches,
  };

  const stored = {
    id: randomUUID(),
    createdAt: now,
    promptVersion: CHAT_PROMPT_VERSION,
    tone,
    focus,
    contextWindow: contextPack.requestContext.mode,
    recentMatches: contextPack.requestContext.recentMatches,
    user: userMessage,
    assistant: assistantMessage,
  };

  await repo.insertCareerDirectorEvent(userId, careerId, "CHAT", stored);
  return stored;
}

async function getCareerDirectorHistory(userId, careerId) {
  await repo.assertCareerOwnership(careerId, userId);
  const rows = await repo.listCareerDirectorEvents(userId, careerId, 200);

  const reports = [];
  const chats = [];

  for (const row of rows) {
    const payload = row.payload || {};
    if (row.eventType === "REPORT") {
      reports.push(payload);
      continue;
    }
    if (row.eventType === "CHAT") {
      if (payload.user) chats.push(payload.user);
      if (payload.assistant) chats.push(payload.assistant);
    }
  }

  return { reports, chats };
}

module.exports = {
  generateCareerDirectorReport,
  chatCareerDirector,
  getCareerDirectorHistory,
  __testables: {
    buildContextPack,
    buildDataQuality,
    buildPromptPayload,
  },
};
