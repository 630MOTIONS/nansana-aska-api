import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  StreamableFile,
} from "@nestjs/common";
import { MediaService } from "./media.service.js";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  // Public. An image never changes once uploaded (a new upload gets a new id),
  // so browsers may keep it for a year. "?w=480" asks for a copy that is at
  // least that many pixels wide.
  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  async get(@Param("id") id: string, @Query("w") w?: string) {
    const parsed = w ? Number.parseInt(w, 10) : NaN;
    const width = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

    const image = await this.media.get(id, width);
    if (!image) throw new NotFoundException("Image not found.");

    const bytes = Buffer.from(image.data);
    return new StreamableFile(bytes, {
      type: image.contentType,
      length: bytes.length,
    });
  }
}
