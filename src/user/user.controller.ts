import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user-dto";
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from "./dto/otp.dto";
import { ContactDto } from "./dto/contact.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { CreateTestimonialDto } from "./dto/create-testimonial.dto";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { VerifyPhoneOtpDto } from "./dto/verify-otp.dto";
import { SendPhoneOtpDto } from "./dto/send-otp.dto";



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

  // Twilio OTP Services

  @Post('phone/send-otp')
  sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.userService.sendPhoneOtp(dto);
  }

  @Post('phone/verify-otp')
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.userService.verifyPhoneOtp(dto);
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

  // API to handle google oauth 
  // 1) Start OAuth flow
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // guard redirects to Google
  }

  // 2) Callback URL that Google redirects back to
  // 2) Callback URL that Google redirects back to
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    const user = req.user; // from GoogleStrategy

    // SAME RESPONSE FORMAT AS NORMAL LOGIN
    const loginResponse = await this.userService.buildLoginResponse(user);

    const redirectURL = `${process.env.FRONTEND_URL}/google-auth-success?data=${encodeURIComponent(JSON.stringify(loginResponse))}`;

    return res.redirect(redirectURL);
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
  async getDashboardDetailsforChart(
    @Query('period') period: 'last6months' | 'last12months' | 'last3months' = 'last6months',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      let data;

      // ✅ If start and end date provided, use date range logic
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid date format. Use YYYY-MM-DD format.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        data = await this.userService.getDashboardChartByDateRange(start, end);
      } else {
        // ✅ Validate and use period
        if (!['last6months', 'last12months', 'last3months'].includes(period)) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid period parameter. Use: last6months or last12months',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        data = await this.userService.getDashboardDetailsforChart(period);
      }

      return {
        success: true,
        status: HttpStatus.OK,
        message: startDate && endDate
          ? `Chart data from ${startDate} to ${endDate} fetched successfully`
          : `Chart data for ${period} fetched successfully`,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch chart data',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get('fetch-dashboard-graph')
  async getDashboardDetailsforGraph(
    @Query('period') period: 'last6months' | 'last12months' | 'last3months' = 'last6months',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      let data;

      // ✅ If start and end date provided, use date range logic
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid date format. Use YYYY-MM-DD format.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        data = await this.userService.getDashboardGraphByDateRange(start, end);
      } else {
        // ✅ Validate and use period
        if (!['last6months', 'last12months', 'last3months'].includes(period)) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid period parameter. Use: last6months or last12months',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        data = await this.userService.getDashboardDetailsforGraph(period);
      }

      return {
        success: true,
        status: HttpStatus.OK,
        message: startDate && endDate
          ? `Graph data from ${startDate} to ${endDate} fetched successfully`
          : `Graph data for ${period} fetched successfully`,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch graph data',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Get('full-dashboard')
  async getFullDashboard(
    @Query('chartPeriod') chartPeriod?: 'last6months' | 'last12months',
    @Query('graphPeriod') graphPeriod?: 'last6months' | 'last12months',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      // 1️⃣ Validate custom date range
      let useCustomRange = false;
      let start: Date | null = null;
      let end: Date | null = null;

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid date format. Use ISO format (YYYY-MM-DD).',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        useCustomRange = true;
      }

      // 2️⃣ Validate periods if date range not provided
      const validPeriods = ['last6months', 'last12months'];
      const chartPeriodFinal = validPeriods.includes(chartPeriod || '') ? chartPeriod : 'last6months';
      const graphPeriodFinal = validPeriods.includes(graphPeriod || '') ? graphPeriod : 'last6months';

      // 3️⃣ Call service methods accordingly
      let overview, monthlyVisitors, revenueTrend;

      if (useCustomRange && start && end) {
        [overview, monthlyVisitors, revenueTrend] = await Promise.all([
          this.userService.getDashboardDetailsByDateRange(start, end),
          this.userService.getDashboardChartByDateRange(start, end),
          this.userService.getDashboardGraphByDateRange(start, end),
        ]);
      } else {
        [overview, monthlyVisitors, revenueTrend] = await Promise.all([
          this.userService.getDashboardDetails(),
          this.userService.getDashboardDetailsforChart(chartPeriodFinal),
          this.userService.getDashboardDetailsforGraph(graphPeriodFinal),
        ]);
      }

      // 4️⃣ Return unified response
      return {
        success: true,
        status: HttpStatus.OK,
        message: 'Full dashboard data fetched successfully',
        data: {
          overview,
          monthlyVisitors,
          revenueTrend,
          filterType: useCustomRange ? 'custom-date-range' : 'period',
          ...(useCustomRange && { startDate, endDate }),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch full dashboard data',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Tesimonial module

  @Post('create-testimonial')
  async create(@Body() dto: CreateTestimonialDto) {
    return this.userService.createTestimonial(dto);
  }

  @Get('fetch-all-testimonials/:page')
  async findAll(@Param('page', ParseIntPipe) page: number) {
    return this.userService.findAllTestimonials(page);
  }

  @Get('fetch-testimonial/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOneTestimonial(id);
  }

  @Put('update-testimonial/:id')
  async update(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.userService.updateTestimonial(id);
  }

  @Delete('delete-testimonial/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeTestimonial(id);
  }


}