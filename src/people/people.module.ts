import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PlayersController, StaffController } from "./people.controller.js";
import { PlayersService } from "./players.service.js";
import { StaffService } from "./staff.service.js";

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [PlayersController, StaffController],
  providers: [PlayersService, StaffService],
  exports: [PlayersService, StaffService],
})
export class PeopleModule {}
