import { Controller, Get, Query } from "@nestjs/common";
import { ListPlayersDto } from "./dto/player.dto.js";
import { PlayersService } from "./players.service.js";
import { StaffService } from "./staff.service.js";

// Public: published people only. Hidden people are never returned here.
@Controller("players")
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  list(@Query() query: ListPlayersDto) {
    return this.players.listPublished(query.squad);
  }
}

@Controller("staff")
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list() {
    return this.staff.listPublished();
  }
}
