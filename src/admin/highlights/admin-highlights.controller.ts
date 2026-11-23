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
  CreateHighlightDto,
  UpdateHighlightDto,
} from "../../highlights/dto/highlight.dto.js";
import { HighlightsService } from "../../highlights/highlights.service.js";

@Controller("admin/highlights")
@UseGuards(AuthGuard)
export class AdminHighlightsController {
  constructor(private readonly highlights: HighlightsService) {}

  @Get()
  list() {
    return this.highlights.listAll();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.highlights.get(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateHighlightDto, @CurrentUser() user: AuthUser) {
    return this.highlights.create(dto, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateHighlightDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.highlights.update(id, dto, user);
  }

  @Put(":id/thumbnail")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  setThumbnail(
    @Param("id") id: string,
    @UploadedFile() file: UploadedImage | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.highlights.setThumbnail(id, file, user);
  }

  @Post(":id/thumbnail/refresh")
  @HttpCode(200)
  refreshThumbnail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.highlights.refreshThumbnail(id, user);
  }

  @Delete(":id/thumbnail")
  @HttpCode(204)
  async removeThumbnail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.highlights.removeThumbnail(id, user);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.highlights.remove(id, user);
  }
}
