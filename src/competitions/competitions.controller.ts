import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CompetitionsService } from './competitions.service.js';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitions: CompetitionsService) {}

  @Get()
  list() {
    return this.competitions.list();
  }

  @Get(':slug/standings')
  async standings(@Param('slug') slug: string) {
    const result = await this.competitions.standings(slug);
    if (!result) throw new NotFoundException('Competition not found');
    return result;
  }
}
