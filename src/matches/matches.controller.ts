import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ListMatchesDto } from './dto/list-matches.dto.js';
import { MatchesService } from './matches.service.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@Query() query: ListMatchesDto) {
    return this.matches.list(query);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    const match = await this.matches.get(slug);
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }
}
