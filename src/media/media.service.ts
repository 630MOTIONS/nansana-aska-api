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
    const bytes = new Uint8Array(processed.data);

    const row = await this.prisma.mediaImage.create({
      data: {
        contentType: processed.contentType,
        data: bytes,
        size: processed.size,
        width: processed.width,
        height: processed.height,
      },
      select: { id: true, width: true, height: true },
    });

    return {
      id: row.id,
      url: `/media/${row.id}`,
      width: row.width,
      height: row.height,
    };
  }

  get(id: string) {
    return this.prisma.mediaImage.findUnique({
      where: { id },
      select: { contentType: true, data: true },
    });
  }

  // Deletes a photo only when nothing uses it: not an article cover or text,
  // the gallery, a player or staff photo, or a video thumbnail.
  async removeIfUnused(id: string) {
    const [articles, gallery, players, staff, videos] = await Promise.all([
      this.prisma.article.count({
        where: {
          OR: [{ coverImageId: id }, { body: { contains: `/media/${id}` } }],
        },
      }),
      this.prisma.galleryPhoto.count({ where: { imageId: id } }),
      this.prisma.player.count({ where: { photoId: id } }),
      this.prisma.staffMember.count({ where: { photoId: id } }),
      this.prisma.highlight.count({ where: { thumbnailId: id } }),
    ]);
    if (articles + gallery + players + staff + videos === 0) {
      await this.prisma.mediaImage.deleteMany({ where: { id } });
    }
  }
}
