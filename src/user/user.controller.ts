import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
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

    // 
    @Get('fetch-dashboard-detatils')
    async getDashboardDetails(
    ) {
        try {
            const data = await this.userService.getDashboardDetails();
            return {
                success: true,
                status: HttpStatus.OK,
                message: 'Dashboard overview fetched successfully',
                data: data
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch dashboard overview',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('fetch-dashboard-chart')
    async getDashboardDetailsforChart(@Query('period') period: 'last6months' | 'last12months' = 'last6months') {
        try {
            // Validate period parameter
            if (!['last6months', 'last12months'].includes(period)) {
                throw new HttpException(
                    {
                        success: false,
                        message: 'Invalid period parameter. Use: last6months or last12months'
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const data = await this.userService.getDashboardDetailsforGraph(period);
            return {
                success: true,
                status: HttpStatus.OK,
                message: `Revenue trend data for ${period} fetched successfully`,
                data: data
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch revenue trend data',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('fetch-dashboard-graph')
    async getDashboardDetailsforGraph(@Query('period') period: 'last6months' | 'last12months' = 'last6months') {
        try {
            // Validate period parameter
            if (!['last6months', 'last12months'].includes(period)) {
                throw new HttpException(
                    {
                        success: false,
                        message: 'Invalid period parameter. Use: last6months or last12months'
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const data = await this.userService.getDashboardDetailsforChart(period);
            return {
                success: true,
                status: HttpStatus.OK,
                message: `Monthly visitors data for ${period} fetched successfully`,
                data: data
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch monthly visitors data',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    @Get('full-dashboard')
    async getFullDashboard(
        @Query('chartPeriod') chartPeriod: 'last6months' | 'last12months' = 'last6months',
        @Query('graphPeriod') graphPeriod: 'last6months' | 'last12months' = 'last6months'
    ) {
        try {
            // Validate period parameters
            const validPeriods = ['last6months', 'last12months'];
            if (!validPeriods.includes(chartPeriod) || !validPeriods.includes(graphPeriod)) {
                throw new HttpException(
                    {
                        success: false,
                        message: 'Invalid period parameters. Use: last6months or last12months'
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const [overview, monthlyVisitors, revenueTrend] = await Promise.all([
                this.userService.getDashboardDetails(),
                this.userService.getDashboardDetailsforChart(chartPeriod),
                this.userService.getDashboardDetailsforGraph(graphPeriod)
            ]);

            return {
                success: true,
                status: HttpStatus.OK,
                message: 'Full dashboard data fetched successfully',
                data: {
                    overview: overview,
                    monthlyVisitors: monthlyVisitors,
                    revenueTrend: revenueTrend
                }
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to fetch full dashboard data',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}