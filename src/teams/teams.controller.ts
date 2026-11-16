import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
} from "@nestjs/common";
import { TeamsService } from "./teams.service.js";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  // Public. The URLs the API hands out end in ?v=<timestamp>, so a replaced
  // logo gets a new URL and is never served stale.
  @Get(":slug/logo")
  @Header("Cache-Control", "public, max-age=86400")
  @Header("X-Content-Type-Options", "nosniff")
  async logo(@Param("slug") slug: string) {
    const logo = await this.teams.getLogo(slug);
    if (!logo) throw new NotFoundException("This team has no logo.");
    return new StreamableFile(logo.data, { type: logo.contentType });
  }
}
