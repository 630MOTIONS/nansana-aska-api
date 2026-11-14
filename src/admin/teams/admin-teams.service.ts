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
import { CreateTeamDto } from "./dto/create-team.dto.js";
import { UpdateTeamDto } from "./dto/update-team.dto.js";

const teamSelect = {
  slug: true,
  name: true,
  squad: true,
  isOurs: true,
} as const;

@Injectable()
export class AdminTeamsService {
  private readonly logger = new Logger(AdminTeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(squad?: "men" | "women") {
    return this.prisma.team.findMany({
      where: { squad },
      orderBy: [{ isOurs: "desc" }, { name: "asc" }],
      select: teamSelect,
    });
  }

  async create(dto: CreateTeamDto, actor: AuthUser) {
    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) {
      throw new BadRequestException("Could not make a slug from that name.");
    }

    const taken = await this.prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException(`A team with the slug "${slug}" already exists.`);
    }

    try {
      const team = await this.prisma.team.create({
        data: {
          slug,
          name: dto.name,
          squad: dto.squad,
          isOurs: dto.isOurs ?? false,
        },
        select: teamSelect,
      });
      this.logger.log(`${actor.email} created team ${slug}`);
      return team;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`A team with the slug "${slug}" already exists.`);
      }
      throw error;
    }
  }

  async update(slug: string, dto: UpdateTeamDto, actor: AuthUser) {
    const existing = await this.prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Team not found.");

    if (dto.name === undefined && dto.isOurs === undefined) {
      throw new BadRequestException("Nothing to change.");
    }

    const team = await this.prisma.team.update({
      where: { slug },
      data: { name: dto.name, isOurs: dto.isOurs },
      select: teamSelect,
    });
    this.logger.log(`${actor.email} updated team ${slug}`);
    return team;
  }

  async remove(slug: string, actor: AuthUser) {
    const team = await this.prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!team) throw new NotFoundException("Team not found.");

    const matches = await this.prisma.match.count({
      where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
    });
    if (matches > 0) {
      throw new ConflictException(
        "This team has matches. Delete or move its matches first.",
      );
    }

    await this.prisma.team.delete({ where: { slug } });
    this.logger.log(`${actor.email} deleted team ${slug}`);
  }
}
