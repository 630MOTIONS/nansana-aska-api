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
import { trim, trimOrNull } from "../../common/transforms.js";

export const STAFF_GROUPS = ["technical", "management"] as const;
export type StaffGroupValue = (typeof STAFF_GROUPS)[number];

export class CreateStaffDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  kicker?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional() @IsIn(STAFF_GROUPS)
  group?: StaffGroupValue;

  @IsOptional() @IsInt() @Min(0) @Max(99)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class UpdateStaffDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  kicker?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional() @IsIn(STAFF_GROUPS)
  group?: StaffGroupValue;

  @IsOptional() @IsInt() @Min(0) @Max(99)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
