import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ArticlesController } from "./articles.controller.js";
import { ArticlesService } from "./articles.service.js";

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
