import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateStaffDto, UpdateStaffDto } from "./dto/staff.dto.js";

const select = {
  id: true,
  name: true,
  title: true,
  kicker: true,
  bio: true,
  group: true,
  sortOrder: true,
  photoId: true,
  published: true,
  updatedAt: true,
} satisfies Prisma.StaffMemberSelect;

type Row = Prisma.StaffMemberGetPayload<{ select: typeof select }>;

function toDto(row: Row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    kicker: row.kicker,
    bio: row.bio,
    group: row.group,
    sortOrder: row.sortOrder,
    published: row.published,
    photoUrl: row.photoId ? `/media/${row.photoId}` : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const order: Prisma.StaffMemberOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { name: "asc" },
];

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async listPublished() {
    const rows = await this.prisma.staffMember.findMany({
      where: { published: true },
      orderBy: order,
      select,
    });
    return rows.map(toDto);
  }

  async listAll() {
    const rows = await this.prisma.staffMember.findMany({
      orderBy: [{ group: "asc" }, ...order],
      select,
    });
    return rows.map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.staffMember.findUnique({ where: { id }, select });
    if (!row) throw new NotFoundException("Staff member not found.");
    return toDto(row);
  }

  async create(dto: CreateStaffDto, actor: AuthUser) {
    const row = await this.prisma.staffMember.create({
      data: {
        name: dto.name,
        title: dto.title,
        kicker: dto.kicker ?? null,
        bio: dto.bio ?? "",
        group: dto.group ?? "technical",
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
      },
      select: { id: true },
    });
    this.logger.log(`${actor.email} added staff member ${dto.name}`);
    return this.get(row.id);
  }

  async update(id: string, dto: UpdateStaffDto, actor: AuthUser) {
    const exists = await this.prisma.staffMember.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Staff member not found.");

    const data: Prisma.StaffMemberUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.kicker !== undefined) data.kicker = dto.kicker;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.group !== undefined) data.group = dto.group;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) data.published = dto.published;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("Nothing to change.");
    }

    await this.prisma.staffMember.update({ where: { id }, data });
    this.logger.log(`${actor.email} updated staff member ${id}`);
    return this.get(id);
  }

  async setPhoto(id: string, file: UploadedImage | undefined, actor: AuthUser) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!member) throw new NotFoundException("Staff member not found.");

    const image = await this.media.create(file);
    await this.prisma.staffMember.update({
      where: { id },
      data: { photoId: image.id },
    });
    if (member.photoId) await this.media.removeIfUnused(member.photoId);

    this.logger.log(`${actor.email} set the photo of staff member ${id}`);
    return this.get(id);
  }

  async removePhoto(id: string, actor: AuthUser) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!member) throw new NotFoundException("Staff member not found.");

    await this.prisma.staffMember.update({
      where: { id },
      data: { photoId: null },
    });
    if (member.photoId) await this.media.removeIfUnused(member.photoId);
    this.logger.log(`${actor.email} removed the photo of staff member ${id}`);
  }

  async remove(id: string, actor: AuthUser) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      select: { photoId: true },
    });
    if (!member) throw new NotFoundException("Staff member not found.");

    await this.prisma.staffMember.delete({ where: { id } });
    if (member.photoId) await this.media.removeIfUnused(member.photoId);
    this.logger.log(`${actor.email} deleted staff member ${id}`);
  }
}
