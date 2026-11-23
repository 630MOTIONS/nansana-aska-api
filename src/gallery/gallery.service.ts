import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  BulkGalleryDto,
  CreateGalleryPhotoDto,
  ListAdminGalleryDto,
  ListGalleryDto,
  UpdateGalleryPhotoDto,
} from "./dto/gallery.dto.js";

const UNTITLED = "Untitled photo";

// A photo needs a real title before it can go on the website.
function hasRealTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.toLowerCase() !== UNTITLED.toLowerCase();
}

const photoSelect = {
  id: true,
  title: true,
  caption: true,
  category: true,
  meta: true,
  wide: true,
  featured: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  image: { select: { id: true, width: true, height: true } },
} satisfies Prisma.GalleryPhotoSelect;

type PhotoRow = Prisma.GalleryPhotoGetPayload<{ select: typeof photoSelect }>;

// imageUrl is relative to the API, for example /media/<id>.
function toDto(row: PhotoRow) {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    category: row.category,
    meta: row.meta,
    wide: row.wide,
    featured: row.featured,
    published: row.published,
    imageUrl: `/media/${row.image.id}`,
    width: row.image.width,
    height: row.image.height,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- public: published photos only, newest first ----

  async listPublished(query: ListGalleryDto) {
    const rows = await this.prisma.galleryPhoto.findMany({
      where: { published: true, category: query.category },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 200,
      select: photoSelect,
    });
    return rows.map(toDto);
  }

  // ---- admin ----

  async listAll(query: ListAdminGalleryDto) {
    const rows = await this.prisma.galleryPhoto.findMany({
      where: {
        category: query.category,
        published:
          query.published === undefined ? undefined : query.published === "true",
      },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 200,
      select: photoSelect,
    });
    return rows.map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      select: photoSelect,
    });
    if (!row) throw new NotFoundException("Photo not found.");
    return toDto(row);
  }

  async create(
    file: UploadedImage | undefined,
    dto: CreateGalleryPhotoDto,
    actor: AuthUser,
  ) {
    const image = await this.media.create(file);

    try {
      const row = await this.prisma.galleryPhoto.create({
        data: {
          imageId: image.id,
          title: dto.title || UNTITLED,
          caption: dto.caption ?? "",
          category: dto.category,
          meta: dto.meta || null,
          published: false,
        },
        select: photoSelect,
      });
      this.logger.log(`${actor.email} uploaded gallery photo ${row.id}`);
      return toDto(row);
    } catch (error) {
      // Do not leave an orphaned image behind.
      await this.media.removeIfUnused(image.id);
      throw error;
    }
  }

  async update(id: string, dto: UpdateGalleryPhotoDto, actor: AuthUser) {
    const current = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      select: { title: true, published: true, featured: true },
    });
    if (!current) throw new NotFoundException("Photo not found.");

    const title = dto.title ?? current.title;
    const published = dto.published ?? current.published;

    if (published && !hasRealTitle(title)) {
      throw new BadRequestException("Give the photo a title before publishing it.");
    }
    if (dto.featured === true && !published) {
      throw new BadRequestException("Publish the photo before featuring it.");
    }
    // A hidden photo cannot stay featured.
    const featured = published ? (dto.featured ?? current.featured) : false;

    const data: Prisma.GalleryPhotoUpdateInput = { title, published, featured };
    if (dto.caption !== undefined) data.caption = dto.caption;
    if (dto.category) data.category = dto.category;
    if (dto.meta !== undefined) data.meta = dto.meta;
    if (dto.wide !== undefined) data.wide = dto.wide;

    const update = this.prisma.galleryPhoto.update({ where: { id }, data });
    if (featured) {
      await this.prisma.$transaction([
        this.prisma.galleryPhoto.updateMany({
          where: { featured: true, id: { not: id } },
          data: { featured: false },
        }),
        update,
      ]);
    } else {
      await update;
    }

    this.logger.log(`${actor.email} updated gallery photo ${id}`);
    return this.get(id);
  }

  async bulk(dto: BulkGalleryDto, actor: AuthUser) {
    const ids = Array.from(new Set(dto.ids));

    if (dto.action === "delete") {
      if (actor.role !== "admin") throw new ForbiddenException();

      const rows = await this.prisma.galleryPhoto.findMany({
        where: { id: { in: ids } },
        select: { imageId: true },
      });
      await this.prisma.galleryPhoto.deleteMany({ where: { id: { in: ids } } });
      for (const imageId of new Set(rows.map((row) => row.imageId))) {
        await this.media.removeIfUnused(imageId);
      }
      this.logger.log(`${actor.email} deleted ${rows.length} gallery photos`);
      return { action: dto.action, changed: rows.length, skipped: 0 };
    }

    if (dto.action === "hide") {
      const result = await this.prisma.galleryPhoto.updateMany({
        where: { id: { in: ids } },
        data: { published: false, featured: false },
      });
      this.logger.log(`${actor.email} hid ${result.count} gallery photos`);
      return { action: dto.action, changed: result.count, skipped: 0 };
    }

    // publish: photos that still have no real title are skipped.
    const rows = await this.prisma.galleryPhoto.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true },
    });
    const ready = rows.filter((row) => hasRealTitle(row.title)).map((row) => row.id);
    const result = ready.length
      ? await this.prisma.galleryPhoto.updateMany({
          where: { id: { in: ready } },
          data: { published: true },
        })
      : { count: 0 };

    this.logger.log(`${actor.email} published ${result.count} gallery photos`);
    return {
      action: dto.action,
      changed: result.count,
      skipped: rows.length - ready.length,
    };
  }

  async remove(id: string, actor: AuthUser) {
    const row = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      select: { imageId: true },
    });
    if (!row) throw new NotFoundException("Photo not found.");

    await this.prisma.galleryPhoto.delete({ where: { id } });
    await this.media.removeIfUnused(row.imageId);
    this.logger.log(`${actor.email} deleted gallery photo ${id}`);
  }
}
