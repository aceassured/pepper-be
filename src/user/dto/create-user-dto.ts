import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateUserDto {

  @IsOptional()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Phone is required' })
  @IsString()
  @Matches(/^\+?\d{7,15}$/, { message: 'phone must be digits, allow optional + and 7-15 chars' })
  phone: string;


  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long, include one uppercase, one lowercase, one number, and one special character',
    },
  )
  password: string;
}
