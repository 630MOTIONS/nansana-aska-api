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
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { Roles } from "../../auth/roles.decorator.js";
import { AdminMatchesService } from "./admin-matches.service.js";
import { CreateMatchDto } from "./dto/create-match.dto.js";
import { ListAdminMatchesDto } from "./dto/list-admin-matches.dto.js";
import { SetResultDto } from "./dto/set-result.dto.js";
import { UpdateMatchDto } from "./dto/update-match.dto.js";

@Controller("admin/matches")
@UseGuards(AuthGuard)
export class AdminMatchesController {
  constructor(private readonly matches: AdminMatchesService) {}

  @Get()
  list(@Query() query: ListAdminMatchesDto) {
    return this.matches.list(query);
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.matches.get(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateMatchDto, @CurrentUser() user: AuthUser) {
    return this.matches.create(dto, user);
  }

  @Patch(":slug")
  update(
    @Param("slug") slug: string,
    @Body() dto: UpdateMatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matches.update(slug, dto, user);
  }

  @Put(":slug/result")
  setResult(
    @Param("slug") slug: string,
    @Body() dto: SetResultDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matches.setResult(slug, dto, user);
  }

  @Delete(":slug/result")
  clearResult(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    return this.matches.clearResult(slug, user);
  }

  @Delete(":slug")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    await this.matches.remove(slug, user);
  }
}
