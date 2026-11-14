import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from "class-validator";
import { SLUG_PATTERN } from "../../../common/slug.js";

export class ListAdminMatchesDto {
  @IsOptional()
  @Matches(SLUG_PATTERN)
  competition?: string;

  @IsOptional()
  @IsIn(["men", "women"])
  squad?: "men" | "women";

  @IsOptional()
  @IsIn(["scheduled", "live", "final", "postponed", "cancelled"])
  status?: "scheduled" | "live" | "final" | "postponed" | "cancelled";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
