import { Transform } from "class-transformer";
import {
  Equals,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export const ENQUIRY_TYPES = [
  "general",
  "trials",
  "partnership",
  "media",
] as const;

export type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// Optional fields: the website sends "" when they are left empty.
const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export class CreateEnquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^(?=(?:\D*\d){7,})[+()\-\s\d]+$/, {
    message: "phone must be a valid phone number",
  })
  phone?: string;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organisation?: string;

  @IsIn(ENQUIRY_TYPES)
  type!: EnquiryTypeValue;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @Transform(trim)
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  message!: string;

  @Equals(true, { message: "consent must be given" })
  consent!: boolean;
}
