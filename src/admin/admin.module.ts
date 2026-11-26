import { Module } from "@nestjs/common";
import { ArticlesModule } from "../articles/articles.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { GalleryModule } from "../gallery/gallery.module.js";
import { HighlightsModule } from "../highlights/highlights.module.js";
import { MediaModule } from "../media/media.module.js";
import { PeopleModule } from "../people/people.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SiteImagesModule } from "../site-images/site-images.module.js";
import { AdminArticlesController } from "./articles/admin-articles.controller.js";
import { AdminMediaController } from "./articles/admin-media.controller.js";
import { AdminCompetitionsController } from "./competitions/admin-competitions.controller.js";
import { AdminCompetitionsService } from "./competitions/admin-competitions.service.js";
import { AdminGalleryController } from "./gallery/admin-gallery.controller.js";
import { AdminHighlightsController } from "./highlights/admin-highlights.controller.js";
import { AdminMatchesController } from "./matches/admin-matches.controller.js";
import { AdminMatchesService } from "./matches/admin-matches.service.js";
import { AdminPlayersController } from "./people/admin-players.controller.js";
import { AdminStaffController } from "./people/admin-staff.controller.js";
import { AdminSiteImagesController } from "./site-images/admin-site-images.controller.js";
import { AdminTeamsController } from "./teams/admin-teams.controller.js";
import { AdminTeamsService } from "./teams/admin-teams.service.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ArticlesModule,
    MediaModule,
    GalleryModule,
    PeopleModule,
    HighlightsModule,
    SiteImagesModule,
  ],
  controllers: [
    AdminTeamsController,
    AdminCompetitionsController,
    AdminMatchesController,
    AdminArticlesController,
    AdminMediaController,
    AdminGalleryController,
    AdminPlayersController,
    AdminStaffController,
    AdminHighlightsController,
    AdminSiteImagesController,
  ],
  providers: [
    AdminTeamsService,
    AdminCompetitionsService,
    AdminMatchesService,
  ],
})
export class AdminModule {}
