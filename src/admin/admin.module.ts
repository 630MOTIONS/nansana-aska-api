import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminCompetitionsController } from "./competitions/admin-competitions.controller.js";
import { AdminCompetitionsService } from "./competitions/admin-competitions.service.js";
import { AdminMatchesController } from "./matches/admin-matches.controller.js";
import { AdminMatchesService } from "./matches/admin-matches.service.js";
import { AdminTeamsController } from "./teams/admin-teams.controller.js";
import { AdminTeamsService } from "./teams/admin-teams.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AdminTeamsController,
    AdminCompetitionsController,
    AdminMatchesController,
  ],
  providers: [
    AdminTeamsService,
    AdminCompetitionsService,
    AdminMatchesService,
  ],
})
export class AdminModule {}
