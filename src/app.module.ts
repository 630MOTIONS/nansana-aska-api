import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module.js";
import { ArticlesModule } from "./articles/articles.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CompetitionsModule } from "./competitions/competitions.module.js";
import { EnquiriesModule } from "./enquiries/enquiries.module.js";
import { GalleryModule } from "./gallery/gallery.module.js";
import { HealthModule } from "./health/health.module.js";
import { HighlightsModule } from "./highlights/highlights.module.js";
import { MatchesModule } from "./matches/matches.module.js";
import { MediaModule } from "./media/media.module.js";
import { PeopleModule } from "./people/people.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { SiteImagesModule } from "./site-images/site-images.module.js";
import { TeamsModule } from "./teams/teams.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    EnquiriesModule,
    HealthModule,
    CompetitionsModule,
    MatchesModule,
    TeamsModule,
    MediaModule,
    ArticlesModule,
    GalleryModule,
    PeopleModule,
    HighlightsModule,
    SiteImagesModule,
  ],
})
export class AppModule {}
