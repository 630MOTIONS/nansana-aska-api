import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class ListMatchesDto {
  // A competition slug, for example "fsl-2026-27".
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  competition?: string;

  @IsOptional()
  @IsIn(['men', 'women'])
  squad?: 'men' | 'women';

  // "upcoming" = scheduled or live, soonest first.
  // "results" = finished matches, latest first.
  @IsOptional()
  @IsIn(['upcoming', 'results'])
  view?: 'upcoming' | 'results';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
