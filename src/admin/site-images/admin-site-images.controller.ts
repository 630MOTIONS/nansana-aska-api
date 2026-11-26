import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { MAX_UPLOAD_BYTES } from "../../common/image-processing.js";
import type { UploadedImage } from "../../common/uploaded-image.js";
import { UpdateSiteImageDto } from "../../site-images/dto/update-site-image.dto.js";
import { SiteImagesService } from "../../site-images/site-images.service.js";

@Controller("admin/site-images")
@UseGuards(AuthGuard)
export class AdminSiteImagesController {
  constructor(private readonly siteImages: SiteImagesService) {}

  @Get()
  list() {
    return this.siteImages.list();
  }

  @Put(":key")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  set(
    @Param("key") key: string,
    @UploadedFile() file: UploadedImage | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.siteImages.set(key, file, user);
  }

  @Patch(":key")
  setAlt(
    @Param("key") key: string,
    @Body() dto: UpdateSiteImageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.siteImages.setAlt(key, dto.alt, user);
  }

  @Delete(":key")
  @HttpCode(204)
  async remove(@Param("key") key: string, @CurrentUser() user: AuthUser) {
    await this.siteImages.remove(key, user);
  }
}
