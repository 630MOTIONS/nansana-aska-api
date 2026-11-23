import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { HighlightsController } from "./highlights.controller.js";
import { HighlightsService } from "./highlights.service.js";

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [HighlightsController],
  providers: [HighlightsService],
  exports: [HighlightsService],
})
export class HighlightsModule {}
