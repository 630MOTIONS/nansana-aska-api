import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { Roles } from "../../auth/roles.decorator.js";
import { AdminTeamsService } from "./admin-teams.service.js";
import { CreateTeamDto } from "./dto/create-team.dto.js";
import { ListTeamsDto } from "./dto/list-teams.dto.js";
import { UpdateTeamDto } from "./dto/update-team.dto.js";

@Controller("admin/teams")
@UseGuards(AuthGuard)
export class AdminTeamsController {
  constructor(private readonly teams: AdminTeamsService) {}

  @Get()
  list(@Query() query: ListTeamsDto) {
    return this.teams.list(query.squad);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: AuthUser) {
    return this.teams.create(dto, user);
  }

  @Patch(":slug")
  update(
    @Param("slug") slug: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teams.update(slug, dto, user);
  }

  @Delete(":slug")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    await this.teams.remove(slug, user);
  }
}
