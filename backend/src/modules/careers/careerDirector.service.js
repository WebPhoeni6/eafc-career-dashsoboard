const { randomUUID } = require('crypto');
const { AppError } = require('../../middlewares/error');
const repo = require('./careers.repository');
const { runJsonPrompt } = require('../../services/ai/geminiClient');
const { reportSchema, chatSchema } = require('./careerDirector.schema');

const ADVANCED_FIELDS = [
  'shots',
  'shotsOnTarget',
  'xG',
  'keyPasses',
  'chancesCreated',
  'dribblesAttempted',
  'dribblesCompleted',
  'passAccuracy',
  'crossAccuracy',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sortMatchesByDateAsc(matches) {
  return [...matches].sort((a, b) => {
    const da = `${a.matchDate || ''}#${a.createdAt ? new Date(a.createdAt).toISOString() : ''}`;
    const db = `${b.matchDate || ''}#${b.createdAt ? new Date(b.createdAt).toISOString() : ''}`;
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
    if (unknownAdvancedMap.get(match.id) && toNumber(match[field]) === 0) return 'Not tracked';
  }
  return match[field];
}

function aggregateMatches(matches) {
  const apps = matches.length;
  const goals = matches.reduce((sum, m) => sum + toNumber(m.goals), 0);
  const assists = matches.reduce((sum, m) => sum + toNumber(m.assists), 0);
  const minutes = matches.reduce((sum, m) => sum + toNumber(m.minutesPlayed), 0);
  const ratings = matches.map((m) => toNumber(m.matchRating)).filter((n) => n > 0);
  const wins = matches.filter((m) => toNumber(m.scoreFor) > toNumber(m.scoreAgainst)).length;
  const draws = matches.filter((m) => toNumber(m.scoreFor) === toNumber(m.scoreAgainst)).length;
  const losses = apps - wins - draws;
  const motm = matches.filter((m) => !!m.motm).length;
  const clutchMoments = matches.filter((m) => !!m.clutchMoment).length;

  return {
    apps,
    goals,
    assists,
    ga: goals + assists,
    minutes,
    gaPer90: minutes > 0 ? Number((((goals + assists) / minutes) * 90).toFixed(2)) : 0,
    avgRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0,
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
  const unknownAdvancedMatches = matches.filter((m) => unknownAdvancedMap.get(m.id)).length;

  if (matches.length < 5) {
    flags.push('Small sample size: fewer than 5 matches logged.');
  }

  if (unknownAdvancedMatches > 0) {
    flags.push(
      `Advanced performance stats marked Not tracked in ${unknownAdvancedMatches}/${matches.length || 1} matches.`,
    );
  }

  const uclMatches = matches.filter((m) => m.competition === 'UCL' || m.competition === 'UEL');
  if (uclMatches.length === 0) {
    flags.push('European impact context is Not tracked (no UCL/UEL matches logged).');
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
  const sortedByRating = [...matches].sort((a, b) => toNumber(b.matchRating) - toNumber(a.matchRating));
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
    moments.push(`Hat-trick alert: ${m.goals} goals vs ${m.opponent} (${m.matchDate})`);
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
      mode: 'WHOLE_CAREER',
      recentMatches: null,
      matches: matches.slice(-Math.min(24, Math.max(8, matches.length))),
    };
  }
  return {
    mode: 'LAST_N',
    recentMatches,
    matches: matches.slice(-recentMatches),
  };
}

function buildContextPack(careerData, options = {}) {
  const allMatches = sortMatchesByDateAsc(Array.isArray(careerData.matches) ? careerData.matches : []);
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
    xG: trackedOrUnknown(m, 'xG', quality.unknownAdvancedMap),
    keyPasses: trackedOrUnknown(m, 'keyPasses', quality.unknownAdvancedMap),
    chancesCreated: trackedOrUnknown(m, 'chancesCreated', quality.unknownAdvancedMap),
    passAccuracy: trackedOrUnknown(m, 'passAccuracy', quality.unknownAdvancedMap),
    managerTrust: m.trust || 'Not tracked',
    clutch: !!m.clutchMoment,
    motm: !!m.motm,
  }));

  const uclSubset = allMatches.filter((m) => m.competition === 'UCL' || m.competition === 'UEL');
  const domesticSubset = allMatches.filter((m) => m.competition === 'League' || m.competition === 'Cup');
  const transfers = Array.isArray(careerData.offers) ? careerData.offers : [];
  const contracts = Array.isArray(careerData.contracts) ? careerData.contracts : [];
  const skillSpends = Array.isArray(careerData.skillSpends) ? careerData.skillSpends : [];
  const narrativeTags = Array.isArray(careerData.narrativeTags) ? careerData.narrativeTags : [];
  const pressNotes = Array.isArray(careerData.pressNotes) ? careerData.pressNotes : [];
  const agentNotes = Array.isArray(careerData.agentNotes) ? careerData.agentNotes : [];
  const injuries = Array.isArray(careerData.injuries) ? careerData.injuries : [];
  const suspensions = Array.isArray(careerData.suspensions) ? careerData.suspensions : [];
  const milestones = Array.isArray(careerData.challenges) ? careerData.challenges : [];

  return {
    requestContext: {
      mode: window.mode,
      recentMatches: window.recentMatches,
      tone: options.tone || 'Balanced',
      focus: options.focus || 'Development',
    },
    careerProfile: {
      playerName: careerData.playerName,
      nationality: careerData.nationality,
      club: careerData.club,
      season: careerData.season,
      archetype: careerData.archetype,
      primaryPos: careerData.primaryPos,
      secondaryPos: careerData.secondaryPos || 'Not tracked',
      ovr: careerData.ovr,
      spAvailable: careerData.spAvailable,
      preferredFoot: careerData.preferredFoot,
      weakFootStars: careerData.weakFootStars,
      skillMoves: careerData.skillMoves,
      height: careerData.height,
      weight: careerData.weight,
    },
    careerTotals: aggregateMatches(allMatches),
    seasonSummary: aggregateMatches(window.matches),
    uclSummary: uclSubset.length ? aggregateMatches(uclSubset) : 'Not tracked',
    domesticSummary: domesticSubset.length ? aggregateMatches(domesticSubset) : 'Not tracked',
    lastMatchesTable: windowRows,
    notableMoments: buildNotableMoments(allMatches),
    transferOffers: transfers.slice(-12).map((o) => ({
      club: o.club,
      league: o.league,
      country: o.country,
      role: o.role,
      wage: o.wage || 'Not tracked',
      hasUCL: !!o.hasUCL,
      score: typeof o.score === 'number' ? o.score : 'Not tracked',
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
        : 'Not tracked',
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
      press: pressNotes.slice(-10).map((n) => ({ month: n.month, tag: n.tag || 'Other', content: n.content })),
      agent: agentNotes.slice(-10).map((n) => ({ date: n.date, tag: n.tag, content: n.content })),
      injuries: injuries.slice(-10).map((i) => ({ type: i.type, startDate: i.startDate, returnDate: i.returnDate || 'Not tracked', matchesMissed: i.matchesMissed })),
      suspensions: suspensions.slice(-10).map((s) => ({ type: s.type, competition: s.competition, date: s.date, matchesMissed: s.matchesMissed })),
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
      advancedStatsUnknownMatches: allMatches.filter((m) => quality.unknownAdvancedMap.get(m.id)).length,
      totalMatches: allMatches.length,
    },
  };
}

function reportSystemInstruction() {
  return [
    'You are Career Director: narrative architect, strict analyst, and accountability coach for an EAFC player-career tracker.',
    'Non-negotiable rules:',
    '1) Use ONLY provided context JSON.',
    '2) Never invent stats or events.',
    '3) If data is missing, say "Not tracked".',
    '4) Keep harsh tone critical but respectful. No insults.',
    '5) Return VALID JSON only that matches the schema.',
  ].join('\n');
}

function buildReportPrompt(contextPack) {
  return [
    'Generate a Career Director Report in strict JSON.',
    'Output schema:',
    '{',
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
    '}',
    'Grounding constraints:',
    '- Cite internal evidence in groundingDataPoints (examples: "lastMatchesTable", "careerTotals", "transferOffers", "skills.archetypeStage", "notes.injuries").',
    '- When a field is not available, explicitly use "Not tracked" in rationale text.',
    '- Do not use external football data or game APIs.',
    '',
    `Context JSON: ${JSON.stringify(contextPack)}`,
  ].join('\n');
}

function chatSystemInstruction() {
  return [
    'You are Career Director chat assistant.',
    'Rules:',
    '1) Use only provided context data and recent conversation.',
    '2) Never invent stats. If absent, say "Not tracked".',
    '3) Tone follows requested tone value.',
    '4) You may ask up to 2 follow-up questions only if critical data is missing.',
    '5) Return JSON only.',
  ].join('\n');
}

function buildChatPrompt(contextPack, message, conversation) {
  return [
    'Answer user message with grounded career-director reasoning.',
    'Output schema:',
    '{',
    '  "answer": "string",',
    '  "followUpQuestions": ["0-2 items"],',
    '  "dataQualityFlags": ["list"],',
    '  "groundingDataPoints": ["internal data points used"]',
    '}',
    '',
    `Conversation JSON: ${JSON.stringify(conversation)}`,
    `Context JSON: ${JSON.stringify(contextPack)}`,
    `User message: ${String(message || '')}`,
  ].join('\n');
}

async function generateCareerDirectorReport(userId, careerId, input = {}) {
  const career = await repo.getCareerInsightsData(userId, careerId);
  if (!career) throw new AppError('Career not found', 404, 'NOT_FOUND');

  const tone = input.tone || 'Balanced';
  const focus = input.focus || 'Development';
  const contextPack = buildContextPack(career, {
    tone,
    focus,
    recentMatches: input.recentMatches,
    wholeCareer: input.wholeCareer,
  });

  const parsed = await runJsonPrompt({
    systemInstruction: reportSystemInstruction(),
    prompt: buildReportPrompt(contextPack),
    schema: reportSchema,
    fixPromptSuffix: 'Fix JSON only. Keep exact schema keys.',
  });

  const createdAt = new Date().toISOString();
  const stored = {
    id: randomUUID(),
    createdAt,
    input: {
      tone,
      focus,
      recentMatches: contextPack.requestContext.recentMatches,
      wholeCareer: contextPack.requestContext.mode === 'WHOLE_CAREER',
      contextWindow: contextPack.requestContext.mode,
    },
    output: {
      ...parsed,
      dataQualityFlags: parsed.dataQualityFlags.length ? parsed.dataQualityFlags : contextPack.dataQualityFlags,
    },
  };

  await repo.insertCareerDirectorEvent(userId, careerId, 'REPORT', stored);
  return stored;
}

async function chatCareerDirector(userId, careerId, input = {}) {
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (!message) throw new AppError('Message is required', 400, 'BAD_REQUEST');

  const career = await repo.getCareerInsightsData(userId, careerId);
  if (!career) throw new AppError('Career not found', 404, 'NOT_FOUND');

  const tone = input.tone || 'Balanced';
  const focus = input.focus || 'Development';
  const contextPack = buildContextPack(career, {
    tone,
    focus,
    recentMatches: input.recentMatches,
    wholeCareer: input.wholeCareer,
  });

  const historyRows = await repo.listCareerDirectorEvents(userId, careerId, 80);
  const conversation = [];
  for (const row of historyRows) {
    if (row.eventType !== 'CHAT') continue;
    const payload = row.payload || {};
    if (payload?.user && typeof payload.user === 'object') conversation.push(payload.user);
    if (payload?.assistant && typeof payload.assistant === 'object') conversation.push(payload.assistant);
  }
  const recentConversation = conversation.slice(-12);

  const parsed = await runJsonPrompt({
    systemInstruction: chatSystemInstruction(),
    prompt: buildChatPrompt(contextPack, message, recentConversation),
    schema: chatSchema,
    fixPromptSuffix: 'Fix JSON only. Keep exact schema keys.',
  });

  const now = new Date().toISOString();
  const userMessage = {
    role: 'user',
    content: message,
    timestamp: now,
    tone,
    focus,
    contextWindow: contextPack.requestContext.mode,
    recentMatches: contextPack.requestContext.recentMatches,
  };
  const assistantMessage = {
    role: 'assistant',
    content: parsed.answer,
    followUpQuestions: parsed.followUpQuestions || [],
    dataQualityFlags: parsed.dataQualityFlags?.length ? parsed.dataQualityFlags : contextPack.dataQualityFlags,
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
    tone,
    focus,
    contextWindow: contextPack.requestContext.mode,
    recentMatches: contextPack.requestContext.recentMatches,
    user: userMessage,
    assistant: assistantMessage,
  };

  await repo.insertCareerDirectorEvent(userId, careerId, 'CHAT', stored);
  return stored;
}

async function getCareerDirectorHistory(userId, careerId) {
  await repo.assertCareerOwnership(careerId, userId);
  const rows = await repo.listCareerDirectorEvents(userId, careerId, 200);

  const reports = [];
  const chats = [];

  for (const row of rows) {
    const payload = row.payload || {};
    if (row.eventType === 'REPORT') {
      reports.push(payload);
      continue;
    }
    if (row.eventType === 'CHAT') {
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
  },
};
