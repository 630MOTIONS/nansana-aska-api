import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { calculateStandings } from "./standings.js";

type Squad = "men" | "women";

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.competition.findMany({
      orderBy: [{ season: "desc" }, { name: "asc" }],
      select: { slug: true, name: true, season: true, squad: true },
    });
  }

  // The competition the public table shows for a squad: of the competitions
  // that have one of our teams, the one with the most recent final result.
  // A new season therefore takes over once its first result is entered, and
  // until then the previous table stays. Competitions with no results are
  // ordered by when they were created.
  async currentSlug(squad: Squad): Promise<string | null> {
    const competitions = await this.prisma.competition.findMany({
      where: { squad, teams: { some: { team: { isOurs: true } } } },
      select: {
        slug: true,
        createdAt: true,
        matches: {
          where: { status: "final" },
          orderBy: { kickoffAt: "desc" },
          take: 1,
          select: { kickoffAt: true },
        },
      },
    });
    if (competitions.length === 0) return null;

    const latestResult = (item: (typeof competitions)[number]) =>
      item.matches[0]?.kickoffAt.getTime() ?? 0;

    competitions.sort(
      (a, b) =>
        latestResult(b) - latestResult(a) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return competitions[0].slug;
  }

  async standings(slug: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        season: true,
        pointsForWin: true,
        pointsForDraw: true,
        teams: {
          select: {
            team: {
              select: {
                slug: true,
                name: true,
                isOurs: true,
                logo: { select: { updatedAt: true } },
              },
            },
          },
        },
        matches: {
          where: {
            status: "final",
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

    const teams = competition.teams.map(({ team }) => ({
      slug: team.slug,
      name: team.name,
      isOurs: team.isOurs,
    }));

    // The logo address changes whenever a logo is replaced, so browsers never
    // keep showing an old one.
    const logoUrls = new Map<string, string | null>(
      competition.teams.map(({ team }): [string, string | null] => [
        team.slug,
        team.logo
          ? `/teams/${team.slug}/logo?v=${team.logo.updatedAt.getTime()}`
          : null,
      ]),
    );

    const rows = calculateStandings(
      teams,
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

    const latest = await this.prisma.match.aggregate({
      where: { competitionId: competition.id, status: "final" },
      _max: { matchday: true },
    });

    return {
      competition: {
        slug: competition.slug,
        name: competition.name,
        season: competition.season,
      },
      // The highest matchday with a final result, for "last updated after".
      lastMatchday: latest._max.matchday,
      rows: rows.map((row) => ({
        ...row,
        team: { ...row.team, logoUrl: logoUrls.get(row.team.slug) ?? null },
      })),
    };
  }
}
