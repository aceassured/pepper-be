import { IsOptional, IsString } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  privacyPolicy?: string;
}
