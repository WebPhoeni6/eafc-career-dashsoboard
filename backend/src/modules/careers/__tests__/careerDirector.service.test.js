const { reportSchema } = require('../careerDirector.schema');
const { __testables } = require('../careerDirector.service');

describe('careerDirector schema', () => {
  test('accepts valid report output', () => {
    const payload = {
      headline: 'Breakout momentum under pressure',
      phase: 'breakout',
      phaseConfidence: 0.72,
      reputationScore: { score: 67, rationale: 'Strong domestic output and rising trust.' },
      europeanImpactIndex: { score: 45, rationale: 'Limited UCL sample; impact still forming.' },
      pressureBoard: ['UCL goal drought', 'Big-game consistency', 'Final-third decision speed'],
      storyline: {
        recentArc: 'Recent matches show productive output and sharper movement.',
        seasonArc: 'Season trajectory is upward with occasional variance in finishing quality.',
        longArc: 'Long-term profile suggests a high-ceiling wide forward entering consolidation.',
      },
      ruthlessTruths: [
        'Your best numbers are domestic, not European yet.',
        'Creative volume still dips against stronger opposition.',
        'Sustained elite rating profile is not established.',
      ],
      strengths: ['Finishing efficiency in league games', 'High involvement in attacks', 'Reliable availability'],
      weaknesses: ['European output variance', 'Final-third decision latency', 'Cross quality inconsistency'],
      nextMatchMandates: ['>= 1 G/A', '>= 2 key passes', 'Rating >= 8.0'],
      developmentPlan: [
        { allocation: 'Finishing node', reason: 'Converts chances at higher leverage moments.' },
      ],
      transferOutlook: {
        recommendation: 'conditional',
        rationale: 'Stay if role and UCL opportunities improve; leave if ceiling stalls.',
        thresholds: ['OVR >= 80', 'UCL G/A every 2 matches', 'Crucial or Important role only'],
      },
      milestonesSuggested: [
        { label: 'League goals push', target: 18, unit: 'goals', rationale: 'Current pace supports it.', deadline: 'End of season' },
        { label: 'Creative lift', target: 10, unit: 'assists', rationale: 'Chance creation trend is rising.', deadline: 'End of season' },
        { label: 'UCL statement', target: 5, unit: 'goals', rationale: 'Reputation jump depends on Europe.', deadline: 'UCL final stage' },
      ],
      narrativeTagsSuggested: ['Breakout pressure', 'European proving ground', 'Role-defining season'],
      agentNotesSuggested: ['Do not accept rotation role offers before UCL sample improves.'],
      risks: ['Burnout risk from overuse', 'Form volatility against elite teams'],
      whatToTrackNext: ['Shots on target', 'Progressive carries', 'Big-chance conversion'],
      dataQualityFlags: ['Advanced performance stats marked Not tracked in 2/10 matches.'],
      groundingDataPoints: ['careerTotals', 'lastMatchesTable', 'transferOffers', 'skills.archetypeStage'],
    };

    expect(() => reportSchema.parse(payload)).not.toThrow();
  });

  test('rejects invalid report output', () => {
    expect(() => reportSchema.parse({ phase: 'breakout' })).toThrow();
  });
});

describe('careerDirector data quality and context pack', () => {
  const careerData = {
    playerName: 'Samuel Adebayo',
    nationality: 'Nigeria',
    club: 'PSV',
    season: '2026/27',
    archetype: 'Wide Forward',
    primaryPos: 'RW',
    secondaryPos: 'LW',
    ovr: 78,
    spAvailable: 5,
    preferredFoot: 'Left',
    weakFootStars: 4,
    skillMoves: 4,
    height: '5\'11"',
    weight: '72kg',
    matches: [
      {
        id: 'm1',
        matchDate: '2026-02-01',
        createdAt: '2026-02-01T10:00:00.000Z',
        competition: 'League',
        stage: 'N/A',
        opponent: 'Excelsior',
        scoreFor: 4,
        scoreAgainst: 0,
        minutesPlayed: 90,
        posPlayed: 'RW',
        matchRating: 9.4,
        goals: 1,
        assists: 1,
        shots: 0,
        shotsOnTarget: 0,
        xG: 0,
        keyPasses: 0,
        chancesCreated: 0,
        dribblesAttempted: 0,
        dribblesCompleted: 0,
        passAccuracy: 0,
        crossAccuracy: 0,
        trust: 'Full',
        clutchMoment: false,
        motm: false,
      },
      {
        id: 'm2',
        matchDate: '2026-02-08',
        createdAt: '2026-02-08T10:00:00.000Z',
        competition: 'UCL',
        stage: 'Group',
        opponent: 'Inter',
        scoreFor: 2,
        scoreAgainst: 2,
        minutesPlayed: 90,
        posPlayed: 'RW',
        matchRating: 8.2,
        goals: 1,
        assists: 0,
        shots: 4,
        shotsOnTarget: 2,
        xG: 0.9,
        keyPasses: 3,
        chancesCreated: 2,
        dribblesAttempted: 7,
        dribblesCompleted: 5,
        passAccuracy: 82,
        crossAccuracy: 35,
        trust: 'High',
        clutchMoment: true,
        motm: true,
      },
    ],
    trophies: [],
    challenges: [],
    narrativeTags: [],
    skillSpends: [],
    attributeTargets: [],
    archetypeStage: null,
    trainingLogs: [],
    offers: [],
    contracts: [],
    agentNotes: [],
    injuries: [],
    suspensions: [],
    pressNotes: [],
    achievements: [],
  };

  test('flags unknown advanced stats', () => {
    const result = __testables.buildDataQuality(careerData.matches);
    expect(result.flags.some((flag) => flag.includes('Not tracked'))).toBe(true);
  });

  test('builds context pack with Not tracked fields and windows', () => {
    const pack = __testables.buildContextPack(careerData, {
      tone: 'Balanced',
      focus: 'Development',
      wholeCareer: false,
      recentMatches: 5,
    });

    expect(pack.requestContext.mode).toBe('LAST_N');
    expect(Array.isArray(pack.lastMatchesTable)).toBe(true);
    expect(pack.lastMatchesTable[0].xG).toBe('Not tracked');
    expect(pack.careerTotals.apps).toBe(2);
  });

  test('builds compact prompt payload for deterministic prompting', () => {
    const pack = __testables.buildContextPack(careerData, {
      tone: 'Balanced',
      focus: 'Development',
      wholeCareer: false,
      recentMatches: 8,
    });

    const payload = __testables.buildPromptPayload(pack);

    expect(payload.deterministicMetrics).toBeTruthy();
    expect(payload.recentEvidence.lastMatches.length).toBeLessThanOrEqual(6);
    expect(payload.transferSignals).toBeTruthy();
    expect(payload).not.toHaveProperty('contracts');
  });
});
