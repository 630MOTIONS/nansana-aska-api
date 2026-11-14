import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class SetResultDto {
  @IsInt()
  @Min(0)
  @Max(99)
  homeScore!: number;

  @IsInt()
  @Min(0)
  @Max(99)
  awayScore!: number;

  // "live" keeps the match open while it is being played. Defaults to "final".
  @IsOptional()
  @IsIn(["live", "final"])
  status?: "live" | "final";
}
