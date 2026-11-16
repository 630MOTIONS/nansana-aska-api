import { Module } from "@nestjs/common";
import { ArticlesModule } from "../articles/articles.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminArticlesController } from "./articles/admin-articles.controller.js";
import { AdminMediaController } from "./articles/admin-media.controller.js";
import { AdminCompetitionsController } from "./competitions/admin-competitions.controller.js";
import { AdminCompetitionsService } from "./competitions/admin-competitions.service.js";
import { AdminMatchesController } from "./matches/admin-matches.controller.js";
import { AdminMatchesService } from "./matches/admin-matches.service.js";
import { AdminTeamsController } from "./teams/admin-teams.controller.js";
import { AdminTeamsService } from "./teams/admin-teams.service.js";

@Module({
  imports: [PrismaModule, AuthModule, ArticlesModule, MediaModule],
  controllers: [
    AdminTeamsController,
    AdminCompetitionsController,
    AdminMatchesController,
    AdminArticlesController,
    AdminMediaController,
  ],
  providers: [
    AdminTeamsService,
    AdminCompetitionsService,
    AdminMatchesService,
  ],
})
export class AdminModule {}
