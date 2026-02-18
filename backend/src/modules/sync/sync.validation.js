const { z } = require('zod');

const positionEnum = z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST']);
const stageEnum = z.enum(['N/A', 'Group', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']);
const competitionEnum = z.enum(['Friendly', 'League', 'Cup', 'UCL', 'UEL', 'International', 'Other']);
const trustEnum = z.enum(['Full', 'High', 'Medium', 'Low']);
const preferredFootEnum = z.enum(['Left', 'Right']);
const skillCategoryEnum = z.enum([
  'Pace',
  'Dribbling',
  'Finishing',
  'Passing',
  'Physicality',
  'Defending',
  'Weak Foot',
  'Skill Moves',
  'Other',
]);
const trainingGradeEnum = z.enum(['A', 'B', 'C', 'D']);

const maybeDateTime = z.string().datetime().optional();
const maybeString = z.string().optional();

const importSchema = z.object({
  body: z.object({
    saveName: z.string().min(1),
    career: z
      .object({
        playerName: z.string(),
        nationality: z.string(),
        archetype: z.string(),
        primaryPos: positionEnum,
        secondaryPos: positionEnum.optional(),
        club: z.string(),
        season: z.string(),
        ovr: z.number().int(),
        spAvailable: z.number().int(),
        height: z.string(),
        weight: z.string(),
        preferredFoot: preferredFootEnum,
        weakFootStars: z.number().int().min(1).max(5),
        skillMoves: z.number().int().min(1).max(5),
        badgeUrl: z.string().url().optional().or(z.literal('')),
        flagUrl: z.string().url().optional().or(z.literal('')),
        updatedAt: maybeDateTime,
      })
      .nullable()
      .optional(),
    matches: z
      .array(
        z.object({
          competition: competitionEnum,
          stage: stageEnum,
          matchDate: z.string(),
          opponent: z.string(),
          posPlayed: positionEnum,
          scoreFor: z.number(),
          scoreAgainst: z.number(),
          minutesPlayed: z.number(),
          matchRating: z.number(),
          goals: z.number(),
          assists: z.number(),
          shots: z.number(),
          shotsOnTarget: z.number(),
          xG: z.number(),
          keyPasses: z.number(),
          chancesCreated: z.number(),
          dribblesAttempted: z.number(),
          dribblesCompleted: z.number(),
          passAccuracy: z.number(),
          crossAccuracy: z.number(),
          motm: z.boolean(),
          clutchMoment: z.boolean(),
          objectivesCompleted: z.boolean(),
          objectivesNotes: z.string(),
          opponentStrength: z.number(),
          ovrAfter: z.union([z.number(), z.literal('')]).optional(),
          spAfter: z.union([z.number(), z.literal('')]).optional(),
          trust: trustEnum,
          notes: z.string(),
          performanceImageUrl: z.string().optional(),
          pinned: z.boolean(),
          createdAt: maybeDateTime,
          updatedAt: maybeDateTime,
        }),
      )
      .optional(),
    trophies: z.array(z.object({ name: z.string(), competition: z.string(), season: z.string(), date: z.string() })).optional(),
    challenges: z
      .array(
        z.object({
          season: z.string(),
          label: z.string(),
          target: z.number(),
          current: z.number(),
          unit: z.string(),
          completed: z.boolean(),
        }),
      )
      .optional(),
    narrativeTags: z.array(z.object({ season: z.string(), tag: z.string(), createdAt: maybeDateTime })).optional(),
    skillSpends: z
      .array(
        z.object({
          date: z.string(),
          pointsSpent: z.number(),
          category: skillCategoryEnum,
          attributeTarget: z.string(),
          fromValue: z.number(),
          toValue: z.number(),
          notes: z.string(),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    attributeTargets: z
      .array(
        z.object({
          attribute: z.string(),
          currentValue: z.number(),
          targetValue: z.number(),
          deadline: z.string(),
          achieved: z.boolean(),
          notes: z.string(),
        }),
      )
      .optional(),
    archetypeStage: z
      .object({
        archetype: z.string(),
        stage: z.number(),
        currentPerks: z.array(z.string()),
        nextUnlock: z.string(),
        checklist: z.array(z.object({ perk: z.string(), unlocked: z.boolean() })),
      })
      .nullable()
      .optional(),
    trainingLogs: z
      .array(
        z.object({
          week: z.string(),
          drills: z.array(z.string()),
          grade: trainingGradeEnum,
          xpGained: z.number(),
          notes: z.string(),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    offers: z
      .array(
        z.object({
          club: z.string(),
          league: z.string(),
          country: z.string(),
          role: z.enum(['Crucial', 'Important', 'Rotation', 'Bench']),
          wage: z.string(),
          fee: z.string(),
          hasUCL: z.boolean(),
          status: z.enum(['Pending', 'Accepted', 'Rejected', 'Expired']),
          receivedDate: z.string(),
          decisionDate: maybeString,
          notes: z.string(),
          score: z.number().optional(),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    contracts: z
      .array(
        z.object({
          club: z.string(),
          league: z.string(),
          startSeason: z.string(),
          endSeason: z.string(),
          apps: z.number(),
          goals: z.number(),
          assists: z.number(),
          avgRating: z.number(),
          trophies: z.array(z.string()),
          notes: z.string(),
        }),
      )
      .optional(),
    agentNotes: z
      .array(
        z.object({
          date: z.string(),
          content: z.string(),
          tag: z.enum(['Strategy', 'Rumor', 'Goal', 'Warning', 'Other']),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    injuries: z
      .array(
        z.object({
          type: z.string(),
          startDate: z.string(),
          returnDate: maybeString,
          matchesMissed: z.number(),
          notes: z.string(),
        }),
      )
      .optional(),
    suspensions: z
      .array(
        z.object({
          type: z.enum(['Yellow', 'Red', 'Accumulated']),
          matchesMissed: z.number(),
          competition: z.string(),
          date: z.string(),
          notes: z.string(),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    pressNotes: z
      .array(
        z.object({
          month: z.string(),
          content: z.string(),
          tag: z.enum(['Praise', 'Rumor', 'Transfer', 'Objective', 'Other']).optional(),
          createdAt: maybeDateTime,
        }),
      )
      .optional(),
    achievements: z
      .array(
        z.object({
          key: z.string(),
          label: z.string(),
          description: z.string(),
          icon: z.string(),
          unlockedAt: maybeDateTime,
        }),
      )
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const exportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    careerId: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  importSchema,
  exportSchema,
};
