import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../auth/auth.guard.js";
import { MAX_UPLOAD_BYTES } from "../../common/image-processing.js";
import type { UploadedImage } from "../../common/uploaded-image.js";
import { MediaService } from "../../media/media.service.js";

// Uploads a photo to use inside an article's text. Returns its address.
@Controller("admin/media")
@UseGuards(AuthGuard)
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  upload(@UploadedFile() file: UploadedImage | undefined) {
    return this.media.create(file);
  }
}
