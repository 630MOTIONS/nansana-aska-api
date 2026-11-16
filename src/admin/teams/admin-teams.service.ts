import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../../auth/auth.types.js";
import { isUniqueViolation } from "../../common/errors.js";
import { detectImageType, MAX_LOGO_BYTES } from "../../common/image.js";
import { slugify } from "../../common/slug.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateTeamDto } from "./dto/create-team.dto.js";
import { UpdateTeamDto } from "./dto/update-team.dto.js";

const teamSelect = {
  slug: true,
  name: true,
  squad: true,
  isOurs: true,
  logo: { select: { updatedAt: true } },
} as const;

type TeamRow = {
  slug: string;
  name: string;
  squad: "men" | "women";
  isOurs: boolean;
  logo: { updatedAt: Date } | null;
};

// logoUrl is relative to the API. The updatedAt value in it changes whenever
// the logo is replaced, which keeps browser caches fresh.
function toDto(row: TeamRow) {
  return {
    slug: row.slug,
    name: row.name,
    squad: row.squad,
    isOurs: row.isOurs,
    logoUrl: row.logo
      ? `/teams/${row.slug}/logo?v=${row.logo.updatedAt.getTime()}`
      : null,
  };
}

@Injectable()
export class AdminTeamsService {
  private readonly logger = new Logger(AdminTeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(squad?: "men" | "women") {
    const rows = await this.prisma.team.findMany({
      where: { squad },
      orderBy: [{ isOurs: "desc" }, { name: "asc" }],
      select: teamSelect,
    });
    return rows.map(toDto);
  }

  private async get(slug: string) {
    const row = await this.prisma.team.findUnique({
      where: { slug },
      select: teamSelect,
    });
    if (!row) throw new NotFoundException("Team not found.");
    return toDto(row);
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
      await this.prisma.team.create({
        data: {
          slug,
          name: dto.name,
          squad: dto.squad,
          isOurs: dto.isOurs ?? false,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`A team with the slug "${slug}" already exists.`);
      }
      throw error;
    }

    this.logger.log(`${actor.email} created team ${slug}`);
    return this.get(slug);
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

    await this.prisma.team.update({
      where: { slug },
      data: { name: dto.name, isOurs: dto.isOurs },
    });
    this.logger.log(`${actor.email} updated team ${slug}`);
    return this.get(slug);
  }

  async setLogo(
    slug: string,
    file: { buffer: Buffer; size: number } | undefined,
    actor: AuthUser,
  ) {
    if (!file) throw new BadRequestException("Choose an image file to upload.");
    if (file.size > MAX_LOGO_BYTES) {
      throw new BadRequestException("The logo must be smaller than 500 KB.");
    }

    const contentType = detectImageType(file.buffer);
    if (!contentType) {
      throw new BadRequestException("The logo must be a PNG, JPEG or WebP image.");
    }

    const team = await this.prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!team) throw new NotFoundException("Team not found.");

    const data = new Uint8Array(file.buffer);
    await this.prisma.teamLogo.upsert({
      where: { teamId: team.id },
      update: { contentType, data, size: file.size },
      create: { teamId: team.id, contentType, data, size: file.size },
    });

    this.logger.log(`${actor.email} set the logo of team ${slug}`);
    return this.get(slug);
  }

  async removeLogo(slug: string, actor: AuthUser) {
    const team = await this.prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!team) throw new NotFoundException("Team not found.");

    await this.prisma.teamLogo.deleteMany({ where: { teamId: team.id } });
    this.logger.log(`${actor.email} removed the logo of team ${slug}`);
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
