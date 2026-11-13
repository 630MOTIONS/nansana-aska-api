import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateStandings } from './standings.js';

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.competition.findMany({
      orderBy: [{ season: 'desc' }, { name: 'asc' }],
      select: { slug: true, name: true, season: true, squad: true },
    });
  }

  async standings(slug: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { slug },
      select: {
        slug: true,
        name: true,
        season: true,
        pointsForWin: true,
        pointsForDraw: true,
        teams: {
          select: {
            team: { select: { slug: true, name: true, isOurs: true } },
          },
        },
        matches: {
          where: {
            status: 'final',
            homeScore: { not: null },
            awayScore: { not: null },
          },
          select: {
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { slug: true } },
            awayTeam: { select: { slug: true } },
          },
        },
        adjustments: {
          select: { points: true, team: { select: { slug: true } } },
        },
      },
    });

    if (!competition) return null;

    const rows = calculateStandings(
      competition.teams.map((entry) => entry.team),
      competition.matches.flatMap((match) =>
        match.homeScore !== null && match.awayScore !== null
          ? [
              {
                homeSlug: match.homeTeam.slug,
                awaySlug: match.awayTeam.slug,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
              },
            ]
          : [],
      ),
      competition.adjustments.map((adjustment) => ({
        teamSlug: adjustment.team.slug,
        points: adjustment.points,
      })),
      { win: competition.pointsForWin, draw: competition.pointsForDraw },
    );

    return {
      competition: {
        slug: competition.slug,
        name: competition.name,
        season: competition.season,
      },
      rows,
    };
  }
}
