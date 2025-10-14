import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Put, Query, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateUserDto } from '../user/dto/create-user-dto';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../user/dto/otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Response } from 'express';


@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // 🔹 Login user
    @Post('login')
    async login(@Body() dto: CreateUserDto) {
        return this.adminService.adminLogin(dto)
    }

    // 🔹 Send OTP
    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.adminService.sendOtp(dto)
    }

    // 🔹 Verify OTP
    @Post('verify-otp')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.adminService.verifyOtp(dto)
    }

    // 🔹 Reset Password
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.adminService.resetPassword(dto)
    }

    // 🔹 Edit admin profile
    @Post('update-profile')
    async updateProfile(@Body() dto: UpdateProfileDto) {
        return this.adminService.editProfile(dto)
    }

    // ==== Start Location Management ====

    //Add new location
    @Post('/add-location')
    async createLocation(@Body() dto: CreateLocationDto) {
        return this.adminService.createLocation(dto)
    }

    // Fetch all locations
    @Get('fetch-all-locations/:page')
    async fetchAllLocations(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('state') state: string, @Query('status') status: boolean) {
        return this.adminService.fetchAllLocations(page, search, state, status)
    }

    // Download all locations in excel format
    @Get('download-locations')
    async downloadLocations() {
        return this.adminService.downloadLocations()
    }

    //Edit location details
    @Post('edit-location/:id')
    async updateLocation(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateLocationDto) {
        return this.adminService.editLocation(id, dto)
    }

    //Delete location
    @Delete('delete-location/:id')
    async deleteLocation(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteLocation(id)
    }

    // Get all states
    @Get('get-states')
    async getAllState() {
        return this.adminService.fetchStates()
    }

    // Get all loacations
    @Get('get-districts/:state')
    async getLocations(@Param('state') state: string) {
        return this.adminService.fetchDistricts(state)
    }

    @Put('toggle-location-status/:id')
    async toggleLocationStatus(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.toggleLocationStatus(id)
    }

    // ==== End Location Management ====

    // Fetch all orders with advanced filtering and pagination
    @Get('fetch-order-details/:page')
    async fetchOrderDetails(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('status') status: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string, @Query('state') state: string) {
        return this.adminService.fetchAllOrders(page, search, status, fromDate, toDate, state)
    }

    // Delete order
    @Delete('delete-order/:id')
    async deleteOrder(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteOrder(id)
    }

    // Update the order status
    @Put('update-progress-status/:id')
    async updateOrderStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
        return this.adminService.updateOrderStatus(id, status)
    }

    // ==== End Order Management ====

    // ==== Start of payment managment ====

    //Fetch all the card details for payment dashboard
    @Get('get-payment-dashboard-cards')
    async getPaymentDashboardCards() {
        return this.adminService.fetchPaymentDashboardCards()
    }

    // Fetch all the payment transcation details
    @Get('get-all-transactions/:page')
    async getAllPaymentTransactions(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('status') status: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string,) {
        return this.adminService.fetchAllPaymentTransactions(page, search, status, fromDate, toDate)
    }

    // // GET /orders/:id/invoice
    // @Get('/orders/:id/invoice')
    // async downloadInvoice(
    //     @Param('id', ParseIntPipe) id: number,
    //     @Res() res: Response
    // ) {
    //     const pdfBuffer = await this.adminService.generateInvoicePdfBuffer(id);

    //     // ✅ Ensure pdfBuffer is defined
    //     if (!pdfBuffer) {
    //         return res.status(500).send('Failed to generate PDF');
    //     }

    //     const filename = `invoice-${id}.pdf`;

    //     // ✅ Express Response.set() and .send() are correctly typed
    //     res.setHeader('Content-Type', 'application/pdf');
    //     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    //     res.setHeader('Content-Length', pdfBuffer.length.toString());

    //     res.send(pdfBuffer); // ✅ works with Express Response type
    // }

    //Get all the enum values
    @Get('/fetch-all-enums')
    async fetchAllEnumValues() {
        return this.adminService.fetchAllEnumValue()
    }



}
