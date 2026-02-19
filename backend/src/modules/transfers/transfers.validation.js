const { z } = require('zod');

const roleEnum = z.enum(['Crucial', 'Important', 'Rotation', 'Bench']);
const statusEnum = z.enum(['Pending', 'Accepted', 'Rejected', 'Expired']);
const agentTagEnum = z.enum(['Strategy', 'Rumor', 'Goal', 'Warning', 'Other']);

const careerParam = z.object({ careerId: z.string().min(1) });
const resourceParam = z.object({ careerId: z.string().min(1), id: z.string().min(1) });

const byCareerSchema = z.object({
  body: z.object({}).optional(),
  params: careerParam,
  query: z.object({}).optional(),
});

const byCareerAndIdSchema = z.object({
  body: z.object({}).optional(),
  params: resourceParam,
  query: z.object({}).optional(),
});

const createOfferSchema = z.object({
  body: z.object({
    club: z.string().min(1),
    league: z.string().min(1),
    country: z.string().min(1),
    role: roleEnum,
    wage: z.string().min(1),
    fee: z.string().min(1),
    hasUCL: z.boolean(),
    status: statusEnum,
    receivedDate: z.string().min(1),
    decisionDate: z.string().optional(),
    notes: z.string(),
    score: z.number().int().min(0).max(100).optional(),
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const updateOfferSchema = z.object({
  body: z
    .object({
      club: z.string().min(1).optional(),
      league: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      role: roleEnum.optional(),
      wage: z.string().min(1).optional(),
      fee: z.string().min(1).optional(),
      hasUCL: z.boolean().optional(),
      status: statusEnum.optional(),
      receivedDate: z.string().optional(),
      decisionDate: z.string().optional(),
      notes: z.string().optional(),
      score: z.number().int().min(0).max(100).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: resourceParam,
  query: z.object({}).optional(),
});

const createContractSchema = z.object({
  body: z.object({
    club: z.string().min(1),
    league: z.string().min(1),
    startSeason: z.string().min(1),
    endSeason: z.string().optional(),
    apps: z.number().int().min(0).optional(),
    goals: z.number().int().min(0).optional(),
    assists: z.number().int().min(0).optional(),
    avgRating: z.number().min(0).max(10).optional(),
    trophies: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const updateContractSchema = z.object({
  body: z
    .object({
      club: z.string().min(1).optional(),
      league: z.string().min(1).optional(),
      startSeason: z.string().min(1).optional(),
      endSeason: z.string().min(1).optional(),
      apps: z.number().int().min(0).optional(),
      goals: z.number().int().min(0).optional(),
      assists: z.number().int().min(0).optional(),
      avgRating: z.number().min(0).max(10).optional(),
      trophies: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: resourceParam,
  query: z.object({}).optional(),
});

const createAgentNoteSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    content: z.string().min(1),
    tag: agentTagEnum,
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

module.exports = {
  byCareerSchema,
  byCareerAndIdSchema,
  createOfferSchema,
  updateOfferSchema,
  createContractSchema,
  updateContractSchema,
  createAgentNoteSchema,
};
