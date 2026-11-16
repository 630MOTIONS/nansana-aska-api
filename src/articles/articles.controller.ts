import { Controller, Get, Param, Query } from "@nestjs/common";
import { ArticlesService } from "./articles.service.js";
import { ListPublishedArticlesDto } from "./dto/list-articles.dto.js";

// Public: published articles only. Drafts are never returned here.
@Controller("articles")
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  list(@Query() query: ListPublishedArticlesDto) {
    return this.articles.listPublished(query);
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.articles.getPublished(slug);
  }
}
