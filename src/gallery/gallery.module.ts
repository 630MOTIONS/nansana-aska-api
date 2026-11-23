import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { GalleryController } from "./gallery.controller.js";
import { GalleryService } from "./gallery.service.js";

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
