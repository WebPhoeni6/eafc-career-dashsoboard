import type { Match } from '../../types/match.types';
import type { CareerProfile } from '../../types/career.types';
import { computeKPIs, computeForm, computeCompSplits, computePosSplits, isBigGamePerformer } from '../../services/analytics/kpis';
import { ovrOverTimeSeries, goalsAssistsPerMatchSeries, ratingTrendSeries, gaPer90Series, trustTrendSeries } from '../../services/analytics/charts';
import { MILESTONES } from '../../utils/constants';

export function getDashboardData(matches: Match[], career: CareerProfile | null, chartMatchesArg?: Match[]) {
  const chartMatches = chartMatchesArg ?? matches;
  const kpis = computeKPIs(matches, career?.ovr);
  const form = computeForm(matches);
  const compSplits = computeCompSplits(matches);
  const posSplits = computePosSplits(matches);
  const bigGamePerformer = isBigGamePerformer(matches);

  const milestones = MILESTONES.map((m) => {
    let current = 0;
    if (m.unit === 'goals')      current = kpis.goals;
    if (m.unit === 'assists')    current = kpis.assists;
    if (m.unit === 'apps')       current = kpis.apps;
    if (m.unit === '10.0s')      current = kpis.perfectRatings;
    if (m.unit === 'hat-tricks') current = kpis.hatTricks;
    return { ...m, current, reached: current >= m.target };
  });

  const charts = {
    ovr: ovrOverTimeSeries(chartMatches, career?.ovr),
    goalsAssists: goalsAssistsPerMatchSeries(chartMatches),
    rating: ratingTrendSeries(chartMatches),
    gaPer90: gaPer90Series(chartMatches),
    trust: trustTrendSeries(chartMatches),
  };

  return { kpis, form, compSplits, posSplits, bigGamePerformer, milestones, charts };
}
