import { Controller, Get, Query } from "@nestjs/common";
import { ListGalleryDto } from "./dto/gallery.dto.js";
import { GalleryService } from "./gallery.service.js";

// Public: published photos only. Hidden photos are never returned here.
@Controller("gallery")
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list(@Query() query: ListGalleryDto) {
    return this.gallery.listPublished(query);
  }
}
