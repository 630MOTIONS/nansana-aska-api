import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  // Length matters more than symbols, so the rule is just 12 or more characters.
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}
