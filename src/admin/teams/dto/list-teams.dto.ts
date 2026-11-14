import { IsIn, IsOptional } from "class-validator";

export class ListTeamsDto {
  @IsOptional()
  @IsIn(["men", "women"])
  squad?: "men" | "women";
}
