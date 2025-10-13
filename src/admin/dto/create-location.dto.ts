import {
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Length,
  IsOptional,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @Length(1, 100, { message: 'State name must be between 1 and 100 characters.' })
  state: string;

  @IsString()
  @Length(1, 100, { message: 'District name must be between 1 and 100 characters.' })
  district: string;

  @IsString()
  @Length(3, 10, { message: 'Pincode must be between 3 and 10 characters.' })
  pinCode: string;

  @IsInt({ message: 'Minimum quantity must be an integer.' })
  @Min(1, { message: 'Minimum quantity must be at least 1.' })
  minQuantity: number;

  @IsInt({ message: 'Maximum quantity must be an integer.' })
  @Min(1, { message: 'Maximum quantity must be at least 1.' })
  maxQuantity: number;

  @IsString({ message: 'Price per unit must be an integer string.' })
  pricePerUnit: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value.' })
  isActive?: boolean; // optional; defaults to true in DB
}
