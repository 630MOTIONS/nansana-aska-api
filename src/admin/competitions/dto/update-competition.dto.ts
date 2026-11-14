import { Transform } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim } from "../../../common/transforms.js";

export class UpdateCompetitionDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  season?: string;

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
