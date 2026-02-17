export type SkillCategory = 'Pace' | 'Dribbling' | 'Finishing' | 'Passing' | 'Physicality' | 'Defending' | 'Weak Foot' | 'Skill Moves' | 'Other';

export interface SkillSpend {
  id: string;
  date: string;
  pointsSpent: number;
  category: SkillCategory;
  attributeTarget: string; // e.g. "Sprint Speed"
  fromValue: number;
  toValue: number;
  notes: string;
  createdAt: string;
}

export interface ArchetypeStage {
  archetype: string;
  stage: number; // 1-5
  currentPerks: string[];
  nextUnlock: string;
  checklist: { perk: string; unlocked: boolean }[];
}

export interface TrainingLog {
  id: string;
  week: string; // e.g. "2026-W34"
  drills: string[];
  grade: 'A' | 'B' | 'C' | 'D';
  xpGained: number;
  notes: string;
  createdAt: string;
}

export interface AttributeTarget {
  id: string;
  attribute: string;
  currentValue: number;
  targetValue: number;
  deadline: string; // e.g. "2026-10"
  achieved: boolean;
  notes: string;
}
