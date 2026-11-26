import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { isSiteImageKey } from "./site-image-slots.js";

type Row = { key: string; imageId: string; alt: string; updatedAt: Date };

// imageUrl is relative to the API, for example /media/<id>.
function toDto(row: Row) {
  return {
    key: row.key,
    imageUrl: `/media/${row.imageId}`,
    alt: row.alt,
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class SiteImagesService {
  private readonly logger = new Logger(SiteImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list() {
    const rows = await this.prisma.siteImage.findMany({ orderBy: { key: "asc" } });
    return rows.map(toDto);
  }

  async set(key: string, file: UploadedImage | undefined, actor: AuthUser) {
    this.assertKey(key);

    const previous = await this.prisma.siteImage.findUnique({
      where: { key },
      select: { imageId: true },
    });
    const image = await this.media.create(file);

    const row = await this.prisma.siteImage.upsert({
      where: { key },
      update: { imageId: image.id },
      create: { key, imageId: image.id },
    });
    if (previous) await this.media.removeIfUnused(previous.imageId);

    this.logger.log(`${actor.email} set the page image ${key}`);
    return toDto(row);
  }

  async setAlt(key: string, alt: string, actor: AuthUser) {
    this.assertKey(key);
    const exists = await this.prisma.siteImage.findUnique({
      where: { key },
      select: { key: true },
    });
    if (!exists) {
      throw new NotFoundException("Upload a photo for this place first.");
    }

    const row = await this.prisma.siteImage.update({ where: { key }, data: { alt } });
    this.logger.log(`${actor.email} changed the description of page image ${key}`);
    return toDto(row);
  }

  async remove(key: string, actor: AuthUser) {
    this.assertKey(key);
    const previous = await this.prisma.siteImage.findUnique({
      where: { key },
      select: { imageId: true },
    });
    if (!previous) return;

    await this.prisma.siteImage.delete({ where: { key } });
    await this.media.removeIfUnused(previous.imageId);
    this.logger.log(`${actor.email} removed the page image ${key}`);
  }

  private assertKey(key: string) {
    if (!isSiteImageKey(key)) throw new NotFoundException("Unknown image place.");
  }
}
