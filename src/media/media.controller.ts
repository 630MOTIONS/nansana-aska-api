import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
} from "@nestjs/common";
import { MediaService } from "./media.service.js";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  // Public. An image never changes once uploaded (a new upload gets a new id),
  // so browsers may keep it for a year.
  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  @Header("X-Content-Type-Options", "nosniff")
  async get(@Param("id") id: string) {
    const image = await this.media.get(id);
    if (!image) throw new NotFoundException("Image not found.");
    return new StreamableFile(image.data, { type: image.contentType });
  }
}
