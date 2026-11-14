import { Transform } from "class-transformer";
import {
  IsIn,
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

// Every field is optional. Send null for matchday or venue to clear it.
export class UpdateMatchDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  stage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  matchday?: number | null;

  @IsOptional()
  @Matches(KICKOFF_PATTERN, {
    message:
      "kickoffAt must be a date-time with a time zone, for example 2026-11-07T19:30:00+03:00",
  })
  kickoffAt?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  venue?: string | null;

  @IsOptional()
  @Matches(SLUG_PATTERN)
  homeTeam?: string;

  @IsOptional()
  @Matches(SLUG_PATTERN)
  awayTeam?: string;

  // Live and final are set by the result endpoint, because they need a score.
  // Changing the status to any of these clears the score.
  @IsOptional()
  @IsIn(["scheduled", "postponed", "cancelled"])
  status?: "scheduled" | "postponed" | "cancelled";
}
