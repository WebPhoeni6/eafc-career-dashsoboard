const { z } = require('zod');

const competitionEnum = z.enum(['Friendly', 'League', 'Cup', 'UCL', 'UEL', 'International', 'Other']);
const stageEnum = z.enum(['N/A', 'Group', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']);
const positionEnum = z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST']);
const trustEnum = z.enum(['Full', 'High', 'Medium', 'Low']);

const paramsCareerId = z.object({
  careerId: z.string().min(1),
});

const paramsCareerAndId = z.object({
  careerId: z.string().min(1),
  id: z.string().min(1),
});

const ovrSpSchema = z.union([z.number().int(), z.literal('')]).optional();

const matchPayload = z.object({
  competition: competitionEnum,
  stage: stageEnum,
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opponent: z.string().min(1),
  posPlayed: positionEnum,
  scoreFor: z.number().int().min(0),
  scoreAgainst: z.number().int().min(0),
  minutesPlayed: z.number().int().min(0).max(130),
  matchRating: z.number().min(0).max(10),
  goals: z.number().int().min(0),
  assists: z.number().int().min(0),
  shots: z.number().int().min(0),
  shotsOnTarget: z.number().int().min(0),
  xG: z.number().min(0),
  keyPasses: z.number().int().min(0),
  chancesCreated: z.number().int().min(0),
  dribblesAttempted: z.number().int().min(0),
  dribblesCompleted: z.number().int().min(0),
  passAccuracy: z.number().min(0).max(100),
  crossAccuracy: z.number().min(0).max(100),
  motm: z.boolean(),
  clutchMoment: z.boolean(),
  objectivesCompleted: z.boolean(),
  objectivesNotes: z.string(),
  opponentStrength: z.number().int().min(1).max(5),
  ovrAfter: ovrSpSchema,
  spAfter: ovrSpSchema,
  trust: trustEnum,
  notes: z.string(),
  performanceImageUrl: z.string().optional().or(z.literal('')),
  pinned: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const listMatchesSchema = z.object({
  body: z.object({}).optional(),
  params: paramsCareerId,
  query: z.object({
    competition: competitionEnum.optional(),
    posPlayed: positionEnum.optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    pinnedOnly: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .optional()
      .transform((v) => (v === true || v === 'true' ? true : undefined)),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const createMatchSchema = z.object({
  body: matchPayload,
  params: paramsCareerId,
  query: z.object({}).optional(),
});

const updateMatchSchema = z.object({
  body: matchPayload.partial(),
  params: paramsCareerAndId,
  query: z.object({}).optional(),
});

const matchIdSchema = z.object({
  body: z.object({}).optional(),
  params: paramsCareerAndId,
  query: z.object({}).optional(),
});

const analyzePerformanceSchema = z.object({
  body: z.object({}).passthrough().optional(),
  params: paramsCareerId,
  query: z.object({}).optional(),
});

module.exports = {
  listMatchesSchema,
  createMatchSchema,
  updateMatchSchema,
  matchIdSchema,
  analyzePerformanceSchema,
};
