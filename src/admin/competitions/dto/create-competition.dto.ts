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
import { trim } from "../../../common/transforms.js";

export class CreateCompetitionDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  // For example "2026/27".
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  season!: string;

  @IsIn(["men", "women"])
  squad!: "men" | "women";

  // Optional. Made from the name and season when left out.
  @IsOptional()
  @Matches(SLUG_PATTERN)
  @MaxLength(60)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  pointsForWin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  pointsForDraw?: number;
}
