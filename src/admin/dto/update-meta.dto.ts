// src/meta/dto/update-meta.dto.ts
import {
  IsIn,
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export const META_FIELDS = [
  'home',
  'knowOurPepper',
  'articles',
  'contactUs',
  'trackOrder',
  'bookYourPepper',
  'login',
  'terms',
  'privacyPolicy'
] as const;

export type MetaField = typeof META_FIELDS[number];

class MetaValueDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string; // line breaks and spaces preserved as-is

  @IsOptional()
  @IsString()
  keywords!: string;

  @IsOptional()
  @IsString()
  canonicalUrl!: string;
}

export class UpdateMetaDto {
  @IsIn(META_FIELDS, {
    message: `option must be one of: ${META_FIELDS.join(', ')}`,
  })
  option!: MetaField;

  @IsObject()
  @ValidateNested()
  @Type(() => MetaValueDto)
  value!: MetaValueDto;
}
