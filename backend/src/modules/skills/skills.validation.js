const { z } = require('zod');

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

const createSkillSpendSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    pointsSpent: z.number().int().min(1),
    category: skillCategoryEnum,
    attributeTarget: z.string().min(1),
    fromValue: z.number().int().min(0).max(99),
    toValue: z.number().int().min(0).max(99),
    notes: z.string(),
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const createAttributeTargetSchema = z.object({
  body: z.object({
    attribute: z.string().min(1),
    currentValue: z.number().int().min(0).max(99),
    targetValue: z.number().int().min(0).max(99),
    deadline: z.string().min(1),
    achieved: z.boolean(),
    notes: z.string(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const updateAttributeTargetSchema = z.object({
  body: z
    .object({
      attribute: z.string().min(1).optional(),
      currentValue: z.number().int().min(0).max(99).optional(),
      targetValue: z.number().int().min(0).max(99).optional(),
      deadline: z.string().min(1).optional(),
      achieved: z.boolean().optional(),
      notes: z.string().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: resourceParam,
  query: z.object({}).optional(),
});

const upsertArchetypeStageSchema = z.object({
  body: z.object({
    archetype: z.string().min(1),
    stage: z.number().int().min(1).max(5),
    currentPerks: z.array(z.string()),
    nextUnlock: z.string(),
    checklist: z.array(z.object({ perk: z.string(), unlocked: z.boolean() })),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

const createTrainingLogSchema = z.object({
  body: z.object({
    week: z.string().min(1),
    drills: z.array(z.string()),
    grade: trainingGradeEnum,
    xpGained: z.number().int().min(0),
    notes: z.string(),
    createdAt: z.string().datetime().optional(),
  }),
  params: careerParam,
  query: z.object({}).optional(),
});

module.exports = {
  byCareerSchema,
  byCareerAndIdSchema,
  createSkillSpendSchema,
  createAttributeTargetSchema,
  updateAttributeTargetSchema,
  upsertArchetypeStageSchema,
  createTrainingLogSchema,
};
