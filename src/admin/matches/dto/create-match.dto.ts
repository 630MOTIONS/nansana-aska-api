import { Transform } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { SLUG_PATTERN } from "../../../common/slug.js";
import { trim, trimOrNull } from "../../../common/transforms.js";
import { KICKOFF_PATTERN } from "../match-rules.js";

export class CreateMatchDto {
  // Slugs of the competition and the two teams.
  @Matches(SLUG_PATTERN)
  competition!: string;

  @Matches(SLUG_PATTERN)
  homeTeam!: string;

  @Matches(SLUG_PATTERN)
  awayTeam!: string;

  // For example "Matchday 14" or "Quarter-final".
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  stage!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  matchday?: number;

  @Matches(KICKOFF_PATTERN, {
    message:
      "kickoffAt must be a date-time with a time zone, for example 2026-11-07T19:30:00+03:00",
  })
  kickoffAt!: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  venue?: string | null;

  // Optional. Made from the teams and date when left out.
  @IsOptional()
  @Matches(SLUG_PATTERN)
  @MaxLength(100)
  slug?: string;
}
