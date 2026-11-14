import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../../auth/auth.types.js";
import { isUniqueViolation } from "../../common/errors.js";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateMatchDto } from "./dto/create-match.dto.js";
import { ListAdminMatchesDto } from "./dto/list-admin-matches.dto.js";
import { SetResultDto } from "./dto/set-result.dto.js";
import { UpdateMatchDto } from "./dto/update-match.dto.js";
import { kampalaDate, parseKickoff } from "./match-rules.js";

const matchInclude = {
  competition: {
    select: { slug: true, name: true, season: true, squad: true },
  },
  homeTeam: { select: { slug: true, name: true } },
  awayTeam: { select: { slug: true, name: true } },
} satisfies Prisma.MatchInclude;

type MatchRow = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

function toDto(match: MatchRow) {
  return {
    slug: match.slug,
    stage: match.stage,
    matchday: match.matchday,
    kickoffAt: match.kickoffAt.toISOString(),
    venue: match.venue,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    competition: match.competition,
    home: match.homeTeam,
    away: match.awayTeam,
  };
}

const KICKOFF_ERROR =
  "kickoffAt is not a valid date-time. Use a time zone, for example 2026-11-07T19:30:00+03:00.";

@Injectable()
export class AdminMatchesService {
  private readonly logger = new Logger(AdminMatchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAdminMatchesDto) {
    const matches = await this.prisma.match.findMany({
      where: {
        competition: { slug: query.competition, squad: query.squad },
        status: query.status,
      },
      orderBy: { kickoffAt: "desc" },
      take: query.limit ?? 100,
      include: matchInclude,
    });
    return matches.map(toDto);
  }

  async get(slug: string) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      include: matchInclude,
    });
    if (!match) throw new NotFoundException("Match not found.");
    return toDto(match);
  }

  async create(dto: CreateMatchDto, actor: AuthUser) {
    if (dto.homeTeam === dto.awayTeam) {
      throw new BadRequestException("A team cannot play itself.");
    }

    const kickoffAt = parseKickoff(dto.kickoffAt);
    if (!kickoffAt) throw new BadRequestException(KICKOFF_ERROR);

    const competition = await this.prisma.competition.findUnique({
      where: { slug: dto.competition },
      select: { id: true, teams: { select: { teamId: true } } },
    });
    if (!competition) throw new NotFoundException("Competition not found.");

    const { home, away } = await this.resolveTeams(
      dto.homeTeam,
      dto.awayTeam,
      competition.teams.map((entry) => entry.teamId),
    );

    const slug =
      dto.slug ??
      (await this.uniqueSlug(
        `${home.slug}-vs-${away.slug}-${kampalaDate(kickoffAt)}`,
      ));
    if (dto.slug) {
      const taken = await this.prisma.match.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException(`A match with the slug "${slug}" already exists.`);
      }
    }

    try {
      await this.prisma.match.create({
        data: {
          slug,
          competitionId: competition.id,
          stage: dto.stage,
          matchday: dto.matchday,
          kickoffAt,
          venue: dto.venue,
          homeTeamId: home.id,
          awayTeamId: away.id,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`A match with the slug "${slug}" already exists.`);
      }
      throw error;
    }

    this.logger.log(`${actor.email} created match ${slug}`);
    return this.get(slug);
  }

  async update(slug: string, dto: UpdateMatchDto, actor: AuthUser) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      include: {
        competition: {
          select: { id: true, teams: { select: { teamId: true } } },
        },
        homeTeam: { select: { slug: true } },
        awayTeam: { select: { slug: true } },
      },
    });
    if (!match) throw new NotFoundException("Match not found.");

    const data: Prisma.MatchUncheckedUpdateInput = {};

    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.matchday !== undefined) data.matchday = dto.matchday;
    if (dto.venue !== undefined) data.venue = dto.venue;

    if (dto.kickoffAt !== undefined) {
      const kickoffAt = parseKickoff(dto.kickoffAt);
      if (!kickoffAt) throw new BadRequestException(KICKOFF_ERROR);
      data.kickoffAt = kickoffAt;
    }

    if (dto.homeTeam !== undefined || dto.awayTeam !== undefined) {
      if (match.status === "final" || match.status === "live") {
        throw new BadRequestException(
          "Clear the result before changing the teams.",
        );
      }
      const homeSlug = dto.homeTeam ?? match.homeTeam.slug;
      const awaySlug = dto.awayTeam ?? match.awayTeam.slug;
      if (homeSlug === awaySlug) {
        throw new BadRequestException("A team cannot play itself.");
      }
      const { home, away } = await this.resolveTeams(
        homeSlug,
        awaySlug,
        match.competition.teams.map((entry) => entry.teamId),
      );
      data.homeTeamId = home.id;
      data.awayTeamId = away.id;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      data.homeScore = null;
      data.awayScore = null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("Nothing to change.");
    }

    await this.prisma.match.update({ where: { slug }, data });
    this.logger.log(`${actor.email} updated match ${slug}`);
    return this.get(slug);
  }

  async setResult(slug: string, dto: SetResultDto, actor: AuthUser) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!match) throw new NotFoundException("Match not found.");

    if (match.status === "postponed" || match.status === "cancelled") {
      throw new BadRequestException(
        `This match is ${match.status}. Set its status back to scheduled first.`,
      );
    }

    const status = dto.status ?? "final";
    await this.prisma.match.update({
      where: { slug },
      data: { homeScore: dto.homeScore, awayScore: dto.awayScore, status },
    });
    this.logger.log(
      `${actor.email} set ${status} result ${dto.homeScore}-${dto.awayScore} on ${slug}`,
    );
    return this.get(slug);
  }

  async clearResult(slug: string, actor: AuthUser) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!match) throw new NotFoundException("Match not found.");

    await this.prisma.match.update({
      where: { slug },
      data: { homeScore: null, awayScore: null, status: "scheduled" },
    });
    this.logger.log(`${actor.email} cleared the result of ${slug}`);
    return this.get(slug);
  }

  async remove(slug: string, actor: AuthUser) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!match) throw new NotFoundException("Match not found.");

    await this.prisma.match.delete({ where: { slug } });
    this.logger.log(`${actor.email} deleted match ${slug}`);
  }

  // Both teams must exist and be part of the competition.
  private async resolveTeams(
    homeSlug: string,
    awaySlug: string,
    competitionTeamIds: string[],
  ) {
    const teams = await this.prisma.team.findMany({
      where: { slug: { in: [homeSlug, awaySlug] } },
      select: { id: true, slug: true, name: true },
    });
    const home = teams.find((team) => team.slug === homeSlug);
    const away = teams.find((team) => team.slug === awaySlug);
    if (!home) throw new BadRequestException(`Unknown team "${homeSlug}".`);
    if (!away) throw new BadRequestException(`Unknown team "${awaySlug}".`);

    const members = new Set(competitionTeamIds);
    for (const team of [home, away]) {
      if (!members.has(team.id)) {
        throw new BadRequestException(
          `${team.name} is not in this competition. Add it to the competition first.`,
        );
      }
    }
    return { home, away };
  }

  private async uniqueSlug(base: string) {
    for (let attempt = 1; attempt <= 20; attempt++) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const taken = await this.prisma.match.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    throw new ConflictException("Could not make a unique slug for this match.");
  }
}
