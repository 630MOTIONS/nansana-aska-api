import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim } from "../../common/transforms.js";

export const SQUADS = ["men", "women"] as const;
export const POSITIONS = ["goalkeeper", "defender", "winger", "pivot"] as const;
export const ROLES = ["captain", "vice_captain"] as const;
export const FEET = ["right", "left", "both"] as const;

export type SquadValue = (typeof SQUADS)[number];
export type PositionValue = (typeof POSITIONS)[number];
export type RoleValue = (typeof ROLES)[number];
export type FootValue = (typeof FEET)[number];

// Optional numbers can be cleared by sending null.
export class CreatePlayerDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsIn(SQUADS)
  squad!: SquadValue;

  @IsIn(POSITIONS)
  position!: PositionValue;

  @IsOptional() @IsInt() @Min(0) @Max(99)
  number?: number | null;

  @IsOptional() @IsIn(ROLES)
  role?: RoleValue | null;

  @IsOptional() @IsIn(FEET)
  foot?: FootValue | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  appearances?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  goals?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  cleanSheets?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  saves?: number | null;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class UpdatePlayerDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional() @IsIn(SQUADS)
  squad?: SquadValue;

  @IsOptional() @IsIn(POSITIONS)
  position?: PositionValue;

  @IsOptional() @IsInt() @Min(0) @Max(99)
  number?: number | null;

  @IsOptional() @IsIn(ROLES)
  role?: RoleValue | null;

  @IsOptional() @IsIn(FEET)
  foot?: FootValue | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  appearances?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  goals?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  cleanSheets?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(999)
  saves?: number | null;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class ListPlayersDto {
  @IsOptional() @IsIn(SQUADS)
  squad?: SquadValue;
}
