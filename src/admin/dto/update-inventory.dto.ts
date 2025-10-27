import { IsInt, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
    @IsInt()
    @IsOptional()
    maxQuantity?: number;

    @IsInt()
    @IsOptional()
    currentQuantity?: number;
}
