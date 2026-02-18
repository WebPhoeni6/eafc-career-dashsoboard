const { z } = require('zod');

const updateMeSchema = z.object({
  body: z
    .object({
      email: z.string().email().optional(),
      username: z.string().min(3).max(30).optional(),
      avatarUrl: z.string().url().optional().or(z.literal('')),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = {
  updateMeSchema,
};
