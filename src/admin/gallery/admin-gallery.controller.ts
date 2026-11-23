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
  BulkGalleryDto,
  CreateGalleryPhotoDto,
  ListAdminGalleryDto,
  UpdateGalleryPhotoDto,
} from "../../gallery/dto/gallery.dto.js";
import { GalleryService } from "../../gallery/gallery.service.js";

@Controller("admin/gallery")
@UseGuards(AuthGuard)
export class AdminGalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list(@Query() query: ListAdminGalleryDto) {
    return this.gallery.listAll(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.gallery.get(id);
  }

  // One photo per request. The admin uploads a batch as several requests.
  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  create(
    @UploadedFile() file: UploadedImage | undefined,
    @Body() dto: CreateGalleryPhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gallery.create(file, dto, user);
  }

  @Post("bulk")
  @HttpCode(200)
  bulk(@Body() dto: BulkGalleryDto, @CurrentUser() user: AuthUser) {
    return this.gallery.bulk(dto, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateGalleryPhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gallery.update(id, dto, user);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.gallery.remove(id, user);
  }
}
