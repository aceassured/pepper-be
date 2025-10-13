import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class LoginAdminDto {
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
