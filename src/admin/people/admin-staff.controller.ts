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
import { CreateStaffDto, UpdateStaffDto } from "../../people/dto/staff.dto.js";
import { StaffService } from "../../people/staff.service.js";

@Controller("admin/staff")
@UseGuards(AuthGuard)
export class AdminStaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list() {
    return this.staff.listAll();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.staff.get(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateStaffDto, @CurrentUser() user: AuthUser) {
    return this.staff.create(dto, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.staff.update(id, dto, user);
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
    return this.staff.setPhoto(id, file, user);
  }

  @Delete(":id/photo")
  @HttpCode(204)
  async removePhoto(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.staff.removePhoto(id, user);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.staff.remove(id, user);
  }
}
