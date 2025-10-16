import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RefundRequestDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    reason: string;

    // Images come via multipart form-data; not in body — kept for typing/documentation
    @IsOptional()
    images?: any;
}
