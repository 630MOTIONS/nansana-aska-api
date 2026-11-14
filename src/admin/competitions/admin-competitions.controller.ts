import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { Roles } from "../../auth/roles.decorator.js";
import { AdminCompetitionsService } from "./admin-competitions.service.js";
import { CreateCompetitionDto } from "./dto/create-competition.dto.js";
import { SetCompetitionTeamsDto } from "./dto/set-competition-teams.dto.js";
import { UpdateCompetitionDto } from "./dto/update-competition.dto.js";

@Controller("admin/competitions")
@UseGuards(AuthGuard)
export class AdminCompetitionsController {
  constructor(private readonly competitions: AdminCompetitionsService) {}

  @Get()
  list() {
    return this.competitions.list();
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.competitions.get(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCompetitionDto, @CurrentUser() user: AuthUser) {
    return this.competitions.create(dto, user);
  }

  @Patch(":slug")
  update(
    @Param("slug") slug: string,
    @Body() dto: UpdateCompetitionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.competitions.update(slug, dto, user);
  }

  @Put(":slug/teams")
  setTeams(
    @Param("slug") slug: string,
    @Body() dto: SetCompetitionTeamsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.competitions.setTeams(slug, dto.teamSlugs, user);
  }

  @Delete(":slug")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    await this.competitions.remove(slug, user);
  }
}
