export type PointsRules = { win: number; draw: number };

export type StandingTeam = { slug: string; name: string; isOurs: boolean };

export type StandingMatch = {
  homeSlug: string;
  awaySlug: string;
  homeScore: number;
  awayScore: number;
};

export type StandingAdjustment = { teamSlug: string; points: number };

export type StandingRow = {
  position: number;
  team: StandingTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  adjustment: number;
  points: number;
};

type WorkingRow = Omit<StandingRow, 'position'>;

// Ranking order: points, then goal difference, then goals scored, then name.
// ASSUMPTION: confirm FAU's real tie-break rules (some leagues use the result
// between the tied teams first) and change the sort below if they differ.
export function calculateStandings(
  teams: StandingTeam[],
  matches: StandingMatch[],
  adjustments: StandingAdjustment[] = [],
  rules: PointsRules = { win: 3, draw: 1 },
): StandingRow[] {
  const table = new Map<string, WorkingRow>();

  for (const team of teams) {
    table.set(team.slug, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      adjustment: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    const home = table.get(match.homeSlug);
    const away = table.get(match.awaySlug);
    if (!home || !away) continue; // a team that is not in this competition

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += rules.win;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += rules.win;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += rules.draw;
      away.points += rules.draw;
    }
  }

  for (const adjustment of adjustments) {
    const row = table.get(adjustment.teamSlug);
    if (!row) continue;
    row.adjustment += adjustment.points;
    row.points += adjustment.points;
  }

  const rows = Array.from(table.values());
  for (const row of rows) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name),
  );

  return rows.map((row, index) => ({ position: index + 1, ...row }));
}
