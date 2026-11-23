import { IsIn, IsOptional } from "class-validator";

export class CurrentStandingsDto {
  @IsOptional()
  @IsIn(["men", "women"])
  squad?: "men" | "women";
}
