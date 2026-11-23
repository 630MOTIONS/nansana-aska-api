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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { Roles } from "../../auth/roles.decorator.js";
import { MAX_UPLOAD_BYTES } from "../../common/image-processing.js";
import type { UploadedImage } from "../../common/uploaded-image.js";
import {
  CreatePlayerDto,
  ListPlayersDto,
  UpdatePlayerDto,
} from "../../people/dto/player.dto.js";
import { PlayersService } from "../../people/players.service.js";

@Controller("admin/players")
@UseGuards(AuthGuard)
export class AdminPlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  list(@Query() query: ListPlayersDto) {
    return this.players.listAll(query.squad);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.players.get(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlayerDto, @CurrentUser() user: AuthUser) {
    return this.players.create(dto, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePlayerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.players.update(id, dto, user);
  }

  @Put(":id/photo")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  setPhoto(
    @Param("id") id: string,
    @UploadedFile() file: UploadedImage | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.players.setPhoto(id, file, user);
  }

  @Delete(":id/photo")
  @HttpCode(204)
  async removePhoto(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.players.removePhoto(id, user);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.players.remove(id, user);
  }
}
