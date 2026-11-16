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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../auth/auth.guard.js';
import type { AuthUser } from '../../auth/auth.types.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { Roles } from '../../auth/roles.decorator.js';
import { MAX_LOGO_BYTES } from '../../common/image.js';
import { AdminTeamsService } from './admin-teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { ListTeamsDto } from './dto/list-teams.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

// The part of an uploaded file the service uses. Declared here so this code
// does not depend on the global Express.Multer typings.
type UploadedLogo = { buffer: Buffer; size: number };

// The guard runs before the file interceptor, so anonymous uploads are
// refused before any file is read.
@Controller('admin/teams')
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

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teams.update(slug, dto, user);
  }

  @Put(':slug/logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_LOGO_BYTES, files: 1 } }),
  )
  setLogo(
    @Param('slug') slug: string,
    @UploadedFile() file: UploadedLogo | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teams.setLogo(slug, file, user);
  }

  @Delete(':slug/logo')
  @HttpCode(204)
  async removeLogo(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    await this.teams.removeLogo(slug, user);
  }

  @Delete(':slug')
  @Roles('admin')
  @HttpCode(204)
  async remove(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    await this.teams.remove(slug, user);
  }
}
