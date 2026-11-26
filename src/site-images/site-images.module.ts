import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SiteImagesController } from "./site-images.controller.js";
import { SiteImagesService } from "./site-images.service.js";

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [SiteImagesController],
  providers: [SiteImagesService],
  exports: [SiteImagesService],
})
export class SiteImagesModule {}
