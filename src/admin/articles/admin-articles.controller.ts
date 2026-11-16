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
import { CreateArticleDto } from "../../articles/dto/create-article.dto.js";
import { ListAdminArticlesDto } from "../../articles/dto/list-articles.dto.js";
import { UpdateArticleDto } from "../../articles/dto/update-article.dto.js";
import { ArticlesService } from "../../articles/articles.service.js";
import { AuthGuard } from "../../auth/auth.guard.js";
import type { AuthUser } from "../../auth/auth.types.js";
import { CurrentUser } from "../../auth/current-user.decorator.js";
import { Roles } from "../../auth/roles.decorator.js";
import { MAX_UPLOAD_BYTES } from "../../common/image-processing.js";
import type { UploadedImage } from "../../common/uploaded-image.js";

@Controller("admin/articles")
@UseGuards(AuthGuard)
export class AdminArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  list(@Query() query: ListAdminArticlesDto) {
    return this.articles.listAll(query);
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.articles.getAny(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.articles.create(dto, user);
  }

  @Patch(":slug")
  update(
    @Param("slug") slug: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articles.update(slug, dto, user);
  }

  @Put(":slug/cover")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }),
  )
  setCover(
    @Param("slug") slug: string,
    @UploadedFile() file: UploadedImage | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articles.setCover(slug, file, user);
  }

  @Delete(":slug/cover")
  @HttpCode(204)
  async removeCover(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    await this.articles.removeCover(slug, user);
  }

  @Delete(":slug")
  @Roles("admin")
  @HttpCode(204)
  async remove(@Param("slug") slug: string, @CurrentUser() user: AuthUser) {
    await this.articles.remove(slug, user);
  }
}
