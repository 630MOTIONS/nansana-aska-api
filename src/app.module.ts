import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CompetitionsModule } from "./competitions/competitions.module.js";
import { EnquiriesModule } from "./enquiries/enquiries.module.js";
import { HealthModule } from "./health/health.module.js";
import { MatchesModule } from "./matches/matches.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

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
  ],
})
export class AppModule {}
