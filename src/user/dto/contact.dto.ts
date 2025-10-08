import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class ContactDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  phone: string;

  @IsNotEmpty({ message: 'Message is required' })
  message: string;
}
