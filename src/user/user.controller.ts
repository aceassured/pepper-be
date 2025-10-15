import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
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

    // Make a new callback
    @Post('create-callback/:id')
    async createCallBack(@Param('id', ParseIntPipe) id: number) {
        return this.userService.makeCallBack(id)
    }

    // Fetch all the pincodes
    @Get('fetch-all-pincodes')
    getPincodes(
        @Query('state') state: string,
        @Query('district') district: string,
    ) {
        return this.userService.getPincodesByStateAndDistrict(state, district);
    }
}