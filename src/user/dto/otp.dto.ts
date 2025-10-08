import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SendOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'New password is required' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long, include one uppercase, one lowercase, one number, and one special character',
    },
  )
  password: string;
}
