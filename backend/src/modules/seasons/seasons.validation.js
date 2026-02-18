const { z } = require('zod');

const careerParam = z.object({ careerId: z.string().min(1) });
const resourceParam = z.object({ careerId: z.string().min(1), id: z.string().min(1) });

const trophyBody = z.object({
  name: z.string().min(1),
  competition: z.string().min(1),
  season: z.string().min(1),
  date: z.string().min(1),
});

const challengeBody = z.object({
  season: z.string().min(1),
  label: z.string().min(1),
  target: z.number().int(),
  current: z.number().int(),
  unit: z.string().min(1),
  completed: z.boolean(),
});

const narrativeTagBody = z.object({
  season: z.string().min(1),
  tag: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

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

const createTrophySchema = z.object({
  body: trophyBody,
  params: careerParam,
  query: z.object({}).optional(),
});

const createChallengeSchema = z.object({
  body: challengeBody,
  params: careerParam,
  query: z.object({}).optional(),
});

const updateChallengeSchema = z.object({
  body: challengeBody.partial(),
  params: resourceParam,
  query: z.object({}).optional(),
});

const createNarrativeTagSchema = z.object({
  body: narrativeTagBody,
  params: careerParam,
  query: z.object({}).optional(),
});

module.exports = {
  byCareerSchema,
  byCareerAndIdSchema,
  createTrophySchema,
  createChallengeSchema,
  updateChallengeSchema,
  createNarrativeTagSchema,
};
