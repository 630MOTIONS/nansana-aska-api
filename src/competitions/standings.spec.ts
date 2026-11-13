import { describe, expect, it } from 'vitest';
import { calculateStandings } from './standings.js';

const teams = [
  { slug: 'a', name: 'Alpha', isOurs: true },
  { slug: 'b', name: 'Bravo', isOurs: false },
  { slug: 'c', name: 'Charlie', isOurs: false },
];

describe('calculateStandings', () => {
  it('lists every team with zeros before any match is played', () => {
    const rows = calculateStandings(teams, []);
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.played === 0 && row.points === 0)).toBe(
      true,
    );
  });

  it('awards 3 points for a win, 1 for a draw and 0 for a loss', () => {
    const rows = calculateStandings(teams, [
      { homeSlug: 'a', awaySlug: 'b', homeScore: 2, awayScore: 1 },
      { homeSlug: 'b', awaySlug: 'c', homeScore: 1, awayScore: 1 },
    ]);
    const byTeam = Object.fromEntries(rows.map((row) => [row.team.slug, row]));
    expect(byTeam.a.points).toBe(3);
    expect(byTeam.b.points).toBe(1);
    expect(byTeam.c.points).toBe(1);
    expect(byTeam.a.goalDifference).toBe(1);
    expect(byTeam.b.goalDifference).toBe(-1);
  });

  it('ranks by points, then goal difference', () => {
    const rows = calculateStandings(teams, [
      { homeSlug: 'a', awaySlug: 'b', homeScore: 1, awayScore: 0 },
      { homeSlug: 'c', awaySlug: 'b', homeScore: 5, awayScore: 0 },
    ]);
    expect(rows.map((row) => row.team.slug)).toEqual(['c', 'a', 'b']);
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3]);
  });

  it('applies points adjustments', () => {
    const rows = calculateStandings(
      teams,
      [{ homeSlug: 'a', awaySlug: 'b', homeScore: 3, awayScore: 0 }],
      [{ teamSlug: 'a', points: -3 }],
    );
    const alpha = rows.find((row) => row.team.slug === 'a');
    expect(alpha?.points).toBe(0);
    expect(alpha?.adjustment).toBe(-3);
  });

  it('ignores matches involving a team outside the competition', () => {
    const rows = calculateStandings(teams, [
      { homeSlug: 'a', awaySlug: 'zzz', homeScore: 4, awayScore: 0 },
    ]);
    expect(rows.every((row) => row.played === 0)).toBe(true);
  });
});
