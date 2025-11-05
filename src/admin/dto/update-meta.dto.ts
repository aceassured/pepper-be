// src/meta/dto/update-meta.dto.ts
import { IsIn, IsString, IsNotEmpty } from 'class-validator';

export const META_FIELDS = [
  'home',
  'knowOurPepper',
  'articles',
  'contactUs',
  'trackOrder',
  'bookYourPepper',
  'login',
] as const;

export type MetaField = typeof META_FIELDS[number];

export class UpdateMetaDto {
  @IsIn(META_FIELDS, { message: `option must be one of: ${META_FIELDS.join(', ')}` })
  option!: MetaField;

  @IsString({ message: 'value must be a string' })
  // intentionally no trim/transform — we want to preserve spacing exactly as sent
  value!: string;
}
