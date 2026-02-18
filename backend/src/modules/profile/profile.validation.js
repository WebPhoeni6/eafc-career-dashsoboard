const { z } = require('zod');

const suspensionTypeEnum = z.enum(['Yellow', 'Red', 'Accumulated']);
const pressTagEnum = z.enum(['Praise', 'Rumor', 'Transfer', 'Objective', 'Other']);

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

const createInjurySchema = z.object({
  body: z.object({
    type: z.string().min(1),
    startDate: z.string().min(1),
    returnDate: z.string().optional(),
    matchesMissed: z.number().int().min(0),
    notes: z.string(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const updateInjurySchema = z.object({
  body: z
    .object({
      type: z.string().min(1).optional(),
      startDate: z.string().min(1).optional(),
      returnDate: z.string().optional(),
      matchesMissed: z.number().int().min(0).optional(),
      notes: z.string().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: resourceParam,
  query: z.object({}).optional(),
});

const createSuspensionSchema = z.object({
  body: z.object({
    type: suspensionTypeEnum,
    matchesMissed: z.number().int().min(0),
    competition: z.string().min(1),
    date: z.string().min(1),
    notes: z.string(),
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const createPressNoteSchema = z.object({
  body: z.object({
    month: z.string().min(1),
    content: z.string().min(1),
    tag: pressTagEnum.optional(),
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const unlockAchievementSchema = z.object({
  body: z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    unlockedAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const updateAchievementSchema = z.object({
  body: z
    .object({
      label: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      icon: z.string().min(1).optional(),
      unlockedAt: z.string().datetime().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: resourceParam,
  query: z.object({}).optional(),
});

module.exports = {
  byCareerSchema,
  byCareerAndIdSchema,
  createInjurySchema,
  updateInjurySchema,
  createSuspensionSchema,
  createPressNoteSchema,
  unlockAchievementSchema,
  updateAchievementSchema,
};
