import { Controller, Get, Query } from "@nestjs/common";
import { ListHighlightsDto } from "./dto/highlight.dto.js";
import { HighlightsService } from "./highlights.service.js";

// Public: published videos only. Hidden videos are never returned here.
@Controller("highlights")
export class HighlightsController {
  constructor(private readonly highlights: HighlightsService) {}

  @Get()
  list(@Query() query: ListHighlightsDto) {
    return this.highlights.listPublished(query);
  }
}
