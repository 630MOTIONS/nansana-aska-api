import { BadRequestException, Injectable } from "@nestjs/common";
import { processPhoto } from "../common/image-processing.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(file: UploadedImage | undefined) {
    if (!file) throw new BadRequestException("Choose an image file to upload.");

    const processed = await processPhoto(file.buffer);

    const row = await this.prisma.mediaImage.create({
      data: {
        contentType: processed.contentType,
        data: new Uint8Array(processed.data),
        size: processed.size,
        width: processed.width,
        height: processed.height,
      },
      select: { id: true, width: true, height: true },
    });

    if (processed.variants.length > 0) {
      await this.prisma.mediaVariant.createMany({
        data: processed.variants.map((variant) => ({
          imageId: row.id,
          width: variant.width,
          contentType: "image/webp",
          data: new Uint8Array(variant.data),
          size: variant.size,
        })),
      });
    }

    return {
      id: row.id,
      url: `/media/${row.id}`,
      width: row.width,
      height: row.height,
    };
  }

  // With a width, returns the smallest stored copy that is at least that wide.
  // Photos uploaded before the smaller copies existed return the main photo.
  async get(id: string, width?: number) {
    const main = await this.prisma.mediaImage.findUnique({
      where: { id },
      select: { width: true },
    });
    if (!main) return null;

    if (width && width < main.width) {
      const widths = await this.prisma.mediaVariant.findMany({
        where: { imageId: id },
        orderBy: { width: "asc" },
        select: { width: true },
      });
      const pick = widths.find((variant) => variant.width >= width);
      if (pick) {
        const variant = await this.prisma.mediaVariant.findUnique({
          where: { imageId_width: { imageId: id, width: pick.width } },
          select: { contentType: true, data: true },
        });
        if (variant) return variant;
      }
    }

    return this.prisma.mediaImage.findUnique({
      where: { id },
      select: { contentType: true, data: true },
    });
  }

  // Deletes a photo (and its smaller copies) only when nothing uses it: not an
  // article cover or text, the gallery, a player or staff photo, a video
  // thumbnail, or a page image.
  async removeIfUnused(id: string) {
    const [articles, gallery, players, staff, videos, pages] = await Promise.all([
      this.prisma.article.count({
        where: {
          OR: [{ coverImageId: id }, { body: { contains: `/media/${id}` } }],
        },
      }),
      this.prisma.galleryPhoto.count({ where: { imageId: id } }),
      this.prisma.player.count({ where: { photoId: id } }),
      this.prisma.staffMember.count({ where: { photoId: id } }),
      this.prisma.highlight.count({ where: { thumbnailId: id } }),
      this.prisma.siteImage.count({ where: { imageId: id } }),
    ]);
    if (articles + gallery + players + staff + videos + pages === 0) {
      await this.prisma.mediaVariant.deleteMany({ where: { imageId: id } });
      await this.prisma.mediaImage.deleteMany({ where: { id } });
    }
  }
}
