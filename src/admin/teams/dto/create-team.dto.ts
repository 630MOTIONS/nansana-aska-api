import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { SLUG_PATTERN } from "../../../common/slug.js";
import { trim } from "../../../common/transforms.js";

export class CreateTeamDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsIn(["men", "women"])
  squad!: "men" | "women";

  @IsOptional()
  @IsBoolean()
  isOurs?: boolean;

  // Optional. Made from the name when left out. It can never be changed later
  // because the website also uses it to find the team's logo.
  @IsOptional()
  @Matches(SLUG_PATTERN)
  @MaxLength(60)
  slug?: string;
}
