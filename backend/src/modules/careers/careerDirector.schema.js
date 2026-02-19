const { z } = require("zod");

const phaseEnum = z.enum(["breakout", "consolidation", "prime", "decline"]);
const toneEnum = z.enum(["Supportive", "Balanced", "Harsh"]);
const focusEnum = z.enum([
  "UCL",
  "Domestic",
  "Development",
  "Transfers",
  "Mentality",
]);

const reportSchema = z.object({
  headline: z.string().min(1).max(180),
  phase: phaseEnum,
  phaseConfidence: z.number().min(0).max(1),
  reputationScore: z.object({
    score: z.number().min(0).max(100),
    rationale: z.string().min(1).max(600),
  }),
  europeanImpactIndex: z.object({
    score: z.number().min(0).max(100),
    rationale: z.string().min(1).max(600),
  }),
  pressureBoard: z.array(z.string().min(1).max(220)).min(3).max(5),
  storyline: z.object({
    recentArc: z.string().min(1).max(1200),
    seasonArc: z.string().min(1).max(1200),
    longArc: z.string().min(1).max(1200),
  }),
  ruthlessTruths: z.array(z.string().min(1).max(220)).min(3).max(3),
  strengths: z.array(z.string().min(1).max(220)).min(3).max(6),
  weaknesses: z.array(z.string().min(1).max(220)).min(3).max(6),
  nextMatchMandates: z.array(z.string().min(1).max(220)).min(3).max(3),
  developmentPlan: z
    .array(
      z.object({
        allocation: z.string().min(1).max(200),
        reason: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(3),
  transferOutlook: z.object({
    recommendation: z.enum(["stay", "leave", "conditional"]),
    rationale: z.string().min(1).max(700),
    thresholds: z.array(z.string().min(1).max(220)).min(1).max(6),
  }),
  milestonesSuggested: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        target: z.preprocess((value) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return value;
          return Math.round(n);
        }, z.number().int().min(1).max(999)),
        unit: z.string().min(1).max(40),
        rationale: z.string().min(1).max(320),
        deadline: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
  narrativeTagsSuggested: z.array(z.string().min(1).max(80)).min(3).max(6),
  agentNotesSuggested: z.array(z.string().min(1).max(220)).min(1).max(3),
  risks: z.array(z.string().min(1).max(220)).min(2).max(8),
  whatToTrackNext: z.array(z.string().min(1).max(220)).min(1).max(10),
  dataQualityFlags: z.array(z.string().min(1).max(220)).max(20),
  groundingDataPoints: z.array(z.string().min(1).max(220)).min(3).max(20),
});

const chatSchema = z.object({
  answer: z.string().min(1).max(2400),
  followUpQuestions: z.array(z.string().min(1).max(220)).max(2).default([]),
  dataQualityFlags: z.array(z.string().min(1).max(220)).max(20).default([]),
  groundingDataPoints: z.array(z.string().min(1).max(220)).max(20).default([]),
});

module.exports = {
  phaseEnum,
  toneEnum,
  focusEnum,
  reportSchema,
  chatSchema,
};
