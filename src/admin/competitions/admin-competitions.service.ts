import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../../auth/auth.types.js";
import { isUniqueViolation } from "../../common/errors.js";
import { slugify } from "../../common/slug.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateCompetitionDto } from "./dto/create-competition.dto.js";
import { UpdateCompetitionDto } from "./dto/update-competition.dto.js";

const competitionSelect = {
  slug: true,
  name: true,
  season: true,
  squad: true,
  pointsForWin: true,
  pointsForDraw: true,
  teams: {
    select: { team: { select: { slug: true, name: true, isOurs: true } } },
    orderBy: { team: { name: "asc" } },
  },
  _count: { select: { matches: true } },
} as const;

type CompetitionRow = {
  slug: string;
  name: string;
  season: string;
  squad: "men" | "women";
  pointsForWin: number;
  pointsForDraw: number;
  teams: { team: { slug: string; name: string; isOurs: boolean } }[];
  _count: { matches: number };
};

function toDto(row: CompetitionRow) {
  return {
    slug: row.slug,
    name: row.name,
    season: row.season,
    squad: row.squad,
    pointsForWin: row.pointsForWin,
    pointsForDraw: row.pointsForDraw,
    teams: row.teams.map((entry) => entry.team),
    matchCount: row._count.matches,
  };
}

@Injectable()
export class AdminCompetitionsService {
  private readonly logger = new Logger(AdminCompetitionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.competition.findMany({
      orderBy: [{ season: "desc" }, { name: "asc" }],
      select: competitionSelect,
    });
    return rows.map(toDto);
  }

  async get(slug: string) {
    const row = await this.prisma.competition.findUnique({
      where: { slug },
      select: competitionSelect,
    });
    if (!row) throw new NotFoundException("Competition not found.");
    return toDto(row);
  }

  async create(dto: CreateCompetitionDto, actor: AuthUser) {
    const slug = dto.slug ?? slugify(`${dto.name} ${dto.season}`);
    if (!slug) {
      throw new BadRequestException("Could not make a slug from that name.");
    }

    const taken = await this.prisma.competition.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException(
        `A competition with the slug "${slug}" already exists.`,
      );
    }

    try {
      await this.prisma.competition.create({
        data: {
          slug,
          name: dto.name,
          season: dto.season,
          squad: dto.squad,
          pointsForWin: dto.pointsForWin,
          pointsForDraw: dto.pointsForDraw,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A competition with the slug "${slug}" already exists.`,
        );
      }
      throw error;
    }

    this.logger.log(`${actor.email} created competition ${slug}`);
    return this.get(slug);
  }

  async update(slug: string, dto: UpdateCompetitionDto, actor: AuthUser) {
    const existing = await this.prisma.competition.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Competition not found.");

    const data = {
      name: dto.name,
      season: dto.season,
      pointsForWin: dto.pointsForWin,
      pointsForDraw: dto.pointsForDraw,
    };
    if (Object.values(data).every((value) => value === undefined)) {
      throw new BadRequestException("Nothing to change.");
    }

    await this.prisma.competition.update({ where: { slug }, data });
    this.logger.log(`${actor.email} updated competition ${slug}`);
    return this.get(slug);
  }

  // Replaces the set of teams. Teams must belong to the competition's squad.
  async setTeams(slug: string, teamSlugs: string[], actor: AuthUser) {
    const competition = await this.prisma.competition.findUnique({
      where: { slug },
      select: {
        id: true,
        squad: true,
        teams: { select: { teamId: true } },
      },
    });
    if (!competition) throw new NotFoundException("Competition not found.");

    const teams = await this.prisma.team.findMany({
      where: { slug: { in: teamSlugs } },
      select: { id: true, slug: true, name: true, squad: true },
    });

    const missing = teamSlugs.filter(
      (teamSlug) => !teams.some((team) => team.slug === teamSlug),
    );
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown teams: ${missing.join(", ")}.`);
    }

    const wrongSquad = teams.filter((team) => team.squad !== competition.squad);
    if (wrongSquad.length > 0) {
      throw new BadRequestException(
        `These teams belong to the other squad: ${wrongSquad
          .map((team) => team.name)
          .join(", ")}.`,
      );
    }

    const keepIds = new Set(teams.map((team) => team.id));
    const removedIds = competition.teams
      .map((entry) => entry.teamId)
      .filter((teamId) => !keepIds.has(teamId));

    if (removedIds.length > 0) {
      const used = await this.prisma.match.count({
        where: {
          competitionId: competition.id,
          OR: [
            { homeTeamId: { in: removedIds } },
            { awayTeamId: { in: removedIds } },
          ],
        },
      });
      if (used > 0) {
        throw new ConflictException(
          "A team that has matches in this competition cannot be removed. Delete or move its matches first.",
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.competitionTeam.deleteMany({
        where: {
          competitionId: competition.id,
          teamId: { notIn: teams.map((team) => team.id) },
        },
      }),
      this.prisma.competitionTeam.createMany({
        data: teams.map((team) => ({
          competitionId: competition.id,
          teamId: team.id,
        })),
        skipDuplicates: true,
      }),
    ]);

    this.logger.log(
      `${actor.email} set ${teams.length} teams on competition ${slug}`,
    );
    return this.get(slug);
  }

  async remove(slug: string, actor: AuthUser) {
    const competition = await this.prisma.competition.findUnique({
      where: { slug },
      select: { id: true, _count: { select: { matches: true } } },
    });
    if (!competition) throw new NotFoundException("Competition not found.");
    if (competition._count.matches > 0) {
      throw new ConflictException(
        "This competition has matches. Delete its matches first.",
      );
    }

    await this.prisma.competition.delete({ where: { slug } });
    this.logger.log(`${actor.email} deleted competition ${slug}`);
  }
}
