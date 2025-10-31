import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryDto {
    @IsInt()
    @IsOptional()
    maxQuantity?: number;

    @IsInt()
    @IsOptional()
    currentQuantity?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsString()
    reason?: string;

}
