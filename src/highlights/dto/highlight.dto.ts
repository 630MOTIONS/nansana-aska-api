import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim, trimOrNull } from "../../common/transforms.js";

export const VIDEO_CATEGORIES = [
  "match",
  "goals",
  "recaps",
  "training",
  "behind",
  "interviews",
] as const;

export type VideoCategoryValue = (typeof VIDEO_CATEGORIES)[number];

const DURATION = /^\d{1,2}:\d{2}(:\d{2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateHighlightDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsIn(VIDEO_CATEGORIES)
  category!: VideoCategoryValue;

  @Transform(trim)
  @IsString()
  @MaxLength(500)
  videoUrl!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(100)
  kicker?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(DURATION, { message: "duration must look like 4:18 or 1:04:18" })
  duration?: string | null;

  // YYYY-MM-DD. Left out, it is today.
  @IsOptional()
  @Transform(trimOrNull)
  @Matches(DATE, { message: "date must look like 2026-11-22" })
  date?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  matchSlug?: string | null;

  @IsOptional() @IsBoolean() spotlight?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateHighlightDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsIn(VIDEO_CATEGORIES)
  category?: VideoCategoryValue;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(100)
  kicker?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(DURATION, { message: "duration must look like 4:18 or 1:04:18" })
  duration?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(DATE, { message: "date must look like 2026-11-22" })
  date?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  matchSlug?: string | null;

  @IsOptional() @IsBoolean() spotlight?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class ListHighlightsDto {
  @IsOptional()
  @IsIn(VIDEO_CATEGORIES)
  category?: VideoCategoryValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
