import type { Match, AutoTag } from '../../types/match.types';
import { num } from '../../utils/format';

export function getAutoTags(m: Match, isFirst: boolean): AutoTag[] {
  const tags: AutoTag[] = [];
  if (isFirst) tags.push('Debut');
  if (num(m.goals) >= 3) tags.push('Hat-trick');
  else if (num(m.goals) >= 2) tags.push('Brace');
  if (num(m.matchRating) >= 10) tags.push('10.0 Rating');
  if (m.motm) tags.push('MOTM');
  if (m.clutchMoment) tags.push('Clutch');
  if ((m.competition === 'UCL' || m.competition === 'UEL') && m.stage !== 'N/A' && m.stage !== 'Group') {
    if (m.goals > 0) tags.push('Big Game');
  }
  return tags;
}

export function tagColor(tag: AutoTag): string {
  if (tag === 'Hat-trick')    return '#f59e0b';
  if (tag === '10.0 Rating')  return '#22c55e';
  if (tag === 'Debut')        return '#7c5cff';
  if (tag === 'MOTM')         return '#f59e0b';
  if (tag === 'Clutch')       return '#ef4444';
  if (tag === 'Big Game')     return '#f59e0b';
  if (tag === 'Brace')        return '#22c55e';
  return '#9aa7bd';
}
