const { z } = require('zod');

const positionEnum = z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST']);
const preferredFootEnum = z.enum(['Left', 'Right']);

const careerPayload = z.object({
  saveName: z.string().min(1).max(80),
  playerName: z.string().min(1),
  nationality: z.string().min(1),
  archetype: z.string().min(1),
  primaryPos: positionEnum,
  secondaryPos: positionEnum.optional(),
  club: z.string().min(1),
  season: z.string().min(1),
  ovr: z.number().int().min(1).max(99),
  spAvailable: z.number().int().min(0),
  height: z.string().min(1),
  weight: z.string().min(1),
  preferredFoot: preferredFootEnum,
  weakFootStars: z.number().int().min(1).max(5),
  skillMoves: z.number().int().min(1).max(5),
  badgeUrl: z.string().url().optional().or(z.literal('')),
  flagUrl: z.string().url().optional().or(z.literal('')),
  updatedAt: z.string().datetime().optional(),
});

const idParams = z.object({
  id: z.string().min(1),
});

const createCareerSchema = z.object({
  body: careerPayload.extend({
    isActive: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCareerSchema = z.object({
  body: careerPayload.partial().extend({
    isActive: z.boolean().optional(),
  }),
  params: idParams,
  query: z.object({}).optional(),
});

const careerIdSchema = z.object({
  body: z.object({}).optional(),
  params: idParams,
  query: z.object({}).optional(),
});

const careerInsightsSchema = z.object({
  body: z.object({}).optional(),
  params: idParams,
  query: z.object({
    recentMatches: z.coerce.number().int().min(3).max(20).optional(),
  }).optional(),
});

const careerInsightsQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(2).max(300),
    recentMatches: z.coerce.number().int().min(3).max(20).optional(),
  }),
  params: idParams,
  query: z.object({}).optional(),
});

module.exports = {
  createCareerSchema,
  updateCareerSchema,
  careerIdSchema,
  careerInsightsSchema,
  careerInsightsQuestionSchema,
};
