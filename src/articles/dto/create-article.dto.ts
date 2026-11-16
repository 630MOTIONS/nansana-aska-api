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

export const ARTICLE_CATEGORIES = [
  "match_reports",
  "club_updates",
  "team_academy",
  "announcements",
] as const;

export type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number];

export class CreateArticleDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsIn(ARTICLE_CATEGORIES)
  category!: ArticleCategoryValue;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  // Markdown. Whitespace is kept as typed.
  @IsOptional()
  @IsString()
  @MaxLength(60000)
  body?: string;

  // Defaults to the signed-in user's name.
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
