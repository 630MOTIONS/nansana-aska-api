import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { CompetitionsService } from "./competitions.service.js";
import { CurrentStandingsDto } from "./dto/current-standings.dto.js";

@Controller("competitions")
export class CompetitionsController {
  constructor(private readonly competitions: CompetitionsService) {}

  @Get()
  list() {
    return this.competitions.list();
  }

  // Must stay above ":slug/standings", or "current" would be read as a slug.
  @Get("current/standings")
  async current(@Query() query: CurrentStandingsDto) {
    const slug = await this.competitions.currentSlug(query.squad ?? "men");
    if (!slug) throw new NotFoundException("No competition is set up yet.");

    const result = await this.competitions.standings(slug);
    if (!result) throw new NotFoundException("Competition not found");
    return result;
  }

  @Get(":slug/standings")
  async standings(@Param("slug") slug: string) {
    const result = await this.competitions.standings(slug);
    if (!result) throw new NotFoundException("Competition not found");
    return result;
  }
}
