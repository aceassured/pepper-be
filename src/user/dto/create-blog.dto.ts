import { IsOptional, IsString, IsEnum, IsInt, IsArray } from 'class-validator';
import { BlogStatus } from '@prisma/client';

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsString()
  publishedAt?: string; // ISO date string from form-data; convert in service

  @IsOptional()
  @IsInt()
  categoryId?: number;
  
}
