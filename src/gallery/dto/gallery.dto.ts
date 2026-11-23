import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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

export const GALLERY_CATEGORIES = [
  "match_day",
  "training",
  "squads",
  "supporters",
  "events",
] as const;

export type GalleryCategoryValue = (typeof GALLERY_CATEGORIES)[number];

// Sent as multipart form fields next to the file. Only the category is needed:
// photos are uploaded in bulk and titled afterwards.
export class CreateGalleryPhotoDto {
  @IsIn(GALLERY_CATEGORIES)
  category!: GalleryCategoryValue;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(300)
  caption?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  meta?: string;
}

export class UpdateGalleryPhotoDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  caption?: string;

  @IsOptional()
  @IsIn(GALLERY_CATEGORIES)
  category?: GalleryCategoryValue;

  // null (or an empty string) clears the tag.
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  meta?: string | null;

  @IsOptional()
  @IsBoolean()
  wide?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class ListGalleryDto {
  @IsOptional()
  @IsIn(GALLERY_CATEGORIES)
  category?: GalleryCategoryValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class ListAdminGalleryDto extends ListGalleryDto {
  @IsOptional()
  @IsIn(["true", "false"])
  published?: "true" | "false";
}

export class BulkGalleryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids!: string[];

  @IsIn(["publish", "hide", "delete"])
  action!: "publish" | "hide" | "delete";
}
