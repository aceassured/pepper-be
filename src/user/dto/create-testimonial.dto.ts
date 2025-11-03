import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  name: string;

  @IsString()
  place: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
