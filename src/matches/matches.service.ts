import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListMatchesDto } from './dto/list-matches.dto.js';

const matchInclude = {
  competition: {
    select: { slug: true, name: true, season: true, squad: true },
  },
  homeTeam: { select: { slug: true, name: true, isOurs: true } },
  awayTeam: { select: { slug: true, name: true, isOurs: true } },
} satisfies Prisma.MatchInclude;

type MatchWithTeams = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

function toMatchDto(match: MatchWithTeams) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  return {
    slug: match.slug,
    stage: match.stage,
    matchday: match.matchday,
    kickoffAt: match.kickoffAt.toISOString(),
    venue: match.venue,
    status: match.status,
    score: hasScore
      ? { home: match.homeScore as number, away: match.awayScore as number }
      : null,
    competition: match.competition,
    home: match.homeTeam,
    away: match.awayTeam,
  };
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMatchesDto) {
    const where: Prisma.MatchWhereInput = {
      competition: { slug: query.competition, squad: query.squad },
      status:
        query.view === 'upcoming'
          ? { in: ['scheduled', 'live'] }
          : query.view === 'results'
            ? 'final'
            : undefined,
    };
    const direction =
      query.view === 'results' ? ('desc' as const) : ('asc' as const);

    const matches = await this.prisma.match.findMany({
      where,
      orderBy: { kickoffAt: direction },
      take: query.limit ?? 50,
      include: matchInclude,
    });
    return matches.map(toMatchDto);
  }

  async get(slug: string) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      include: matchInclude,
    });
    return match ? toMatchDto(match) : null;
  }
}
