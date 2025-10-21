import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Password is required' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must be at least 8 characters long, include one uppercase, one lowercase, one number, and one special character',
        },
    )
    password: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Password is required' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must be at least 8 characters long, include one uppercase, one lowercase, one number, and one special character',
        },
    )
    currentPassword?: string;
}
