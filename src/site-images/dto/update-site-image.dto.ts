import { Transform } from "class-transformer";
import { IsString, MaxLength } from "class-validator";
import { trim } from "../../common/transforms.js";

// An empty description marks the photo as decorative for screen readers.
export class UpdateSiteImageDto {
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  alt!: string;
}
