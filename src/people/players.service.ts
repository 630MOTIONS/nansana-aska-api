import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreatePlayerDto, UpdatePlayerDto } from "./dto/player.dto.js";
import type { RoleValue, SquadValue } from "./dto/player.dto.js";

const select = {
  id: true,
  name: true,
  squad: true,
  number: true,
  position: true,
  role: true,
  foot: true,
  appearances: true,
  goals: true,
  cleanSheets: true,
  saves: true,
  photoId: true,
  published: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerSelect;

type Row = Prisma.PlayerGetPayload<{ select: typeof select }>;

// photoUrl is relative to the API, for example /media/<id>.
function toDto(row: Row) {
  return {
    id: row.id,
    name: row.name,
    squad: row.squad,
    number: row.number,
    position: row.position,
    role: row.role,
    foot: row.foot,
    appearances: row.appearances,
    goals: row.goals,
    cleanSheets: row.cleanSheets,
    saves: row.saves,
    published: row.published,
    photoUrl: row.photoId ? `/media/${row.photoId}` : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const order: Prisma.PlayerOrderByWithRelationInput[] = [
  { number: { sort: "asc", nulls: "last" } },
  { name: "asc" },
];

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- public ----

  async listPublished(squad?: SquadValue) {
    const rows = await this.prisma.player.findMany({
      where: { published: true, squad },
      orderBy: order,
      select,
    });
    return rows.map(toDto);
  }

  // ---- admin ----

  async listAll(squad?: SquadValue) {
    const rows = await this.prisma.player.findMany({
      where: { squad },
      orderBy: [{ squad: "asc" }, ...order],
      select,
    });
    return rows.map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.player.findUnique({ where: { id }, select });
    if (!row) throw new NotFoundException("Player not found.");
    return toDto(row);
  }

  async create(dto: CreatePlayerDto, actor: AuthUser) {
    await this.assertNumberFree(dto.squad, dto.number ?? null);

    const create = this.prisma.player.create({
      data: {
        name: dto.name,
        squad: dto.squad,
        position: dto.position,
        number: dto.number ?? null,
        role: dto.role ?? null,
        foot: dto.foot ?? null,
        appearances: dto.appearances ?? null,
        goals: dto.goals ?? null,
        cleanSheets: dto.cleanSheets ?? null,
        saves: dto.saves ?? null,
        published: dto.published ?? true,
      },
      select: { id: true },
    });

    let id: string;
    if (dto.role) {
      const [, created] = await this.prisma.$transaction([
        this.clearRole(dto.squad, dto.role),
        create,
      ]);
      id = created.id;
    } else {
      id = (await create).id;
    }

    this.logger.log(`${actor.email} added player ${dto.name}`);
    return this.get(id);
  }

  async update(id: string, dto: UpdatePlayerDto, actor: AuthUser) {
    const current = await this.prisma.player.findUnique({
      where: { id },
      select: { squad: true, number: true, role: true },
    });
    if (!current) throw new NotFoundException("Player not found.");

    const squad = dto.squad ?? current.squad;
    const number = dto.number !== undefined ? dto.number : current.number;
    const role = dto.role !== undefined ? dto.role : current.role;

    if (number !== current.number || squad !== current.squad) {
      await this.assertNumberFree(squad, number, id);
    }

    const data: Prisma.PlayerUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.squad !== undefined) data.squad = dto.squad;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.foot !== undefined) data.foot = dto.foot;
    if (dto.appearances !== undefined) data.appearances = dto.appearances;
    if (dto.goals !== undefined) data.goals = dto.goals;
    if (dto.cleanSheets !== undefined) data.cleanSheets = dto.cleanSheets;
    if (dto.saves !== undefined) data.saves = dto.saves;
    if (dto.published !== undefined) data.published = dto.published;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("Nothing to change.");
    }

    const update = this.prisma.player.update({ where: { id }, data });
    if (role && (role !== current.role || squad !== current.squad)) {
      await this.prisma.$transaction([this.clearRole(squad, role, id), update]);
    } else {
      await update;
    }

    this.logger.log(`${actor.email} updated player ${id}`);
    return this.get(id);
  }

  async setPhoto(id: string, file: UploadedImage | undefined, actor: AuthUser) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!player) throw new NotFoundException("Player not found.");

    const image = await this.media.create(file);
    await this.prisma.player.update({
      where: { id },
      data: { photoId: image.id },
    });
    if (player.photoId) await this.media.removeIfUnused(player.photoId);

    this.logger.log(`${actor.email} set the photo of player ${id}`);
    return this.get(id);
  }

  async removePhoto(id: string, actor: AuthUser) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!player) throw new NotFoundException("Player not found.");

    await this.prisma.player.update({ where: { id }, data: { photoId: null } });
    if (player.photoId) await this.media.removeIfUnused(player.photoId);
    this.logger.log(`${actor.email} removed the photo of player ${id}`);
  }

  async remove(id: string, actor: AuthUser) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!player) throw new NotFoundException("Player not found.");

    await this.prisma.player.delete({ where: { id } });
    if (player.photoId) await this.media.removeIfUnused(player.photoId);
    this.logger.log(`${actor.email} deleted player ${id}`);
  }

  // A shirt number is used once per squad.
  private async assertNumberFree(
    squad: SquadValue,
    number: number | null,
    exceptId?: string,
  ) {
    if (number === null) return;
    const clash = await this.prisma.player.findFirst({
      where: { squad, number, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { name: true },
    });
    if (clash) {
      throw new ConflictException(
        `Shirt number ${number} is already worn by ${clash.name} in this squad.`,
      );
    }
  }

  // One captain and one vice-captain per squad: giving the role to someone
  // takes it from the previous holder.
  private clearRole(squad: SquadValue, role: RoleValue, exceptId?: string) {
    return this.prisma.player.updateMany({
      where: { squad, role, ...(exceptId ? { id: { not: exceptId } } : {}) },
      data: { role: null },
    });
  }
}
