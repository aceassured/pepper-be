import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInventoryDto {
    @IsString()
    @IsNotEmpty()
    month: string; // format: YYYY-MM

    @IsInt()
    maxQuantity: number;

    @IsInt()
    currentQuantity: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
    
    @IsOptional()
    @IsString()
    reason?: string;
}
