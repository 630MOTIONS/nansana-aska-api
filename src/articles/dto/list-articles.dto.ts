import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { ARTICLE_CATEGORIES } from "./create-article.dto.js";
import type { ArticleCategoryValue } from "./create-article.dto.js";

export class ListPublishedArticlesDto {
  @IsOptional()
  @IsIn(ARTICLE_CATEGORIES)
  category?: ArticleCategoryValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ListAdminArticlesDto extends ListPublishedArticlesDto {
  @IsOptional()
  @IsIn(["draft", "published"])
  status?: "draft" | "published";
}
