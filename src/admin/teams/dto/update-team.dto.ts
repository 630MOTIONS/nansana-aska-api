import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { trim } from "../../../common/transforms.js";

export class UpdateTeamDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isOurs?: boolean;
}
