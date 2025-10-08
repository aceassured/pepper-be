import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user-dto";
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from "./dto/otp.dto";
import { ContactDto } from "./dto/contact.dto";



@Controller('user')

export class UserController {
    constructor(private readonly userService: UserService) { }

    // 🔹 Register user
    @Post('register')
    async register(@Body() dto: CreateUserDto) {
        return this.userService.register(dto)
    }

    // 🔹 Login user
    @Post('login')
    async login(@Body() dto: CreateUserDto) {
        return this.userService.login(dto);
    }

    // 🔹 Send OTP
    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.userService.sendOtp(dto);
    }

    // 🔹 Verify OTP
    @Post('verify-otp')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.userService.verifyOtp(dto);
    }

    // 🔹 Reset Password
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.userService.resetPassword(dto);
    }

    // 🔹 Contact Form Submission
    @Post('contact')
    async contact(@Body() dto: ContactDto) {
        return this.userService.contact(dto);
    }
}