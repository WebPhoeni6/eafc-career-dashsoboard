import type { Competition, Stage, ManagerTrust } from '../types/match.types';
import type { Archetype, Position } from '../types/career.types';
import type { SkillCategory } from '../types/skill.types';

export const COMPETITIONS: Competition[] = ['Friendly', 'League', 'Cup', 'UCL', 'UEL', 'International', 'Other'];
export const STAGES: Stage[] = ['N/A', 'Group', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
export const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
export const ARCHETYPES: Archetype[] = ['Magician', 'Spark', 'Engine', 'Anchor', 'Guardian', 'Other'];
export const TRUST_LEVELS: ManagerTrust[] = ['Full', 'High', 'Medium', 'Low'];
export const SKILL_CATEGORIES: SkillCategory[] = ['Pace', 'Dribbling', 'Finishing', 'Passing', 'Physicality', 'Defending', 'Weak Foot', 'Skill Moves', 'Other'];

export const MILESTONES = [
  { key: 'goals_50',   label: '50 Goals',       target: 50,  unit: 'goals' },
  { key: 'goals_100',  label: '100 Goals',      target: 100, unit: 'goals' },
  { key: 'assists_25', label: '25 Assists',     target: 25,  unit: 'assists' },
  { key: 'assists_50', label: '50 Assists',     target: 50,  unit: 'assists' },
  { key: 'apps_50',    label: '50 Appearances', target: 50,  unit: 'apps' },
  { key: 'apps_100',   label: '100 Appearances',target: 100, unit: 'apps' },
  { key: 'rating_10',  label: 'Ten 10.0 Ratings',target: 10, unit: '10.0s' },
  { key: 'hattricks_5',label: '5 Hat-tricks',   target: 5,  unit: 'hat-tricks' },
] as const;

export const ACHIEVEMENT_DEFS = [
  { key: 'debut',           label: 'Debut',              description: 'Played your first match',           icon: '⚽' },
  { key: 'first_goal',      label: 'First Goal',         description: 'Scored your first goal',            icon: '🎯' },
  { key: 'first_ucl_goal',  label: 'UCL Debutant',       description: 'Scored in the Champions League',    icon: '⭐' },
  { key: 'hat_trick',       label: 'Hat-trick Hero',     description: 'Scored a hat-trick',                icon: '🎩' },
  { key: 'rating_10',       label: 'Perfect 10',         description: 'Received a 10.0 match rating',      icon: '💯' },
  { key: 'streak_5_ga',     label: 'On Fire',            description: 'G/A in 5 consecutive matches',      icon: '🔥' },
  { key: 'motm_5',          label: 'Fan Favourite',      description: 'Won MOTM 5 times',                  icon: '🏆' },
  { key: 'clutch_5',        label: 'Ice in Veins',       description: 'Clutch moment in 5 matches',        icon: '🧊' },
  { key: 'big_game',        label: 'Big Game Player',    description: 'Scored in a UCL KO / Final',        icon: '👑' },
  { key: 'dribbles_10',     label: 'Dribble King',       description: '10+ successful dribbles in a match',icon: '🕺' },
] as const;

export const MATCH_TEMPLATES = [
  {
    id: 'league',
    name: 'League Match',
    defaults: { competition: 'League' as Competition, stage: 'N/A' as Stage, minutesPlayed: 90, opponentStrength: 3 as const },
  },
  {
    id: 'ucl',
    name: 'UCL Template',
    defaults: { competition: 'UCL' as Competition, stage: 'Group' as Stage, minutesPlayed: 90, opponentStrength: 4 as const },
  },
  {
    id: 'friendly',
    name: 'Friendly',
    defaults: { competition: 'Friendly' as Competition, stage: 'N/A' as Stage, minutesPlayed: 90, opponentStrength: 2 as const },
  },
];

export const LS_VERSION = 'v2';
export const APP_VERSION = '2.0.0';
