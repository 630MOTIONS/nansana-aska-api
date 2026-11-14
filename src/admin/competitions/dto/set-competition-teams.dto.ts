import { ArrayMaxSize, ArrayUnique, IsArray, Matches } from "class-validator";
import { SLUG_PATTERN } from "../../../common/slug.js";

export class SetCompetitionTeamsDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ArrayUnique()
  @Matches(SLUG_PATTERN, { each: true })
  teamSlugs!: string[];
}
