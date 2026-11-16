import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { trim } from "../../common/transforms.js";
import { ARTICLE_CATEGORIES } from "./create-article.dto.js";
import type { ArticleCategoryValue } from "./create-article.dto.js";

export class UpdateArticleDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsIn(ARTICLE_CATEGORIES)
  category?: ArticleCategoryValue;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60000)
  body?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  authorName?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(["draft", "published"])
  status?: "draft" | "published";
}
