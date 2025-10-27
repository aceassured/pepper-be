import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Put, Query, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateUserDto } from '../user/dto/create-user-dto';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../user/dto/otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Response } from 'express';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';


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

    // ==== Start Order Management ====

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

    @Get('fetch-specific-order/:id')
    async fetchSpecificOrderDetails(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.fetchSpecificOrderDetails(id)
    }

    @Post('bulk-order')
    async createBulkOrder(@Body() dto: CreateOrderDto) {
        return this.adminService.bulkOrder(dto)
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

    //Get all the enum values
    @Get('/fetch-all-enums')
    async fetchAllEnumValues() {
        return this.adminService.fetchAllEnumValue()
    }


    // Fetch all dashboard card data
    @Get('refund-dashboard-cards')
    async refundDashboardCards(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
        return this.adminService.fetchRefundDashboardCards(fromDate, toDate)
    }

    // Fetch all the refund transcation details
    @Get('get-all-refunds/:page')
    async getAllRefunds(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('status') status: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
        return this.adminService.fetchAllRefundRequests(page, search, status, fromDate, toDate)
    }

    // Apporve Refund Endpoint
    @Post(':orderId/refund')
    async refundOrder(
        @Param('orderId', ParseIntPipe) orderId: number,
    ) {
        return this.adminService.refundOrder(orderId)
    }

    // Cancel order refund
    @Put('cancel-refund/:orderId')
    async cancelRefundRequest(@Param('orderId', ParseIntPipe) orderId: number) {
        return this.adminService.cancelRefundOrder(orderId)
    }

    //Fetch all users for export user data
    @Get('export-all-refund-orders')
    async fetchAllRefundOrdersForExport() {
        return this.adminService.exportRefundData()
    }

    // ==== End of refund managment ====

    // ==== callback module ====
    // Fetch all the users
    @Get('fetch-all-users/:page')
    async fetchAllUser(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
        return this.adminService.fetchAllUsers(page, search, fromDate, toDate)
    }

    // Fetch all the user callbacks
    @Get('fetch-all-callbacks/:page')
    async fetchAllUserCallbacks(@Param('page', ParseIntPipe) page: number, @Query('search') search: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
        return this.adminService.fetchAllCallbacks(page, search, fromDate, toDate)
    }

    //Fetch all users for export user data
    @Get('export-all-users')
    async fetchAllUserForExport() {
        return this.adminService.fetchAllUsersForExport()
    }

    // Delete a specific user
    @Delete('delete-user/:id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteUser(id)
    }

    // Delete a specific callback
    @Delete('delete-callback/:id')
    async deleteCallback(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteCallback(id)
    }

    // ====End of callback module ====

    // ==== Start of notification module ====

    // Toggle notification settings
    @Put('/settings/toggle')
    async toggleSetting(@Body('field') field: string) {
        return this.adminService.toggleSetting(field);
    }

    @Get('fetch-settings')
    async fetchSettings() {
        return this.adminService.fetchSettings()
    }

    @Get('daily-summary')
    async geDailySummary() {
        return this.adminService.fetchDailySummary()
    }

    @Get('weekly-summary')
    async getWeeklySummary() {
        return this.adminService.fetchWeeklySummary()
    }

    @Get('monthly-summary')
    async getMonthlySummary() {
        return this.adminService.fetchMonthlySummary()
    }

    // ==== End of notification module ====


    // ==== Start of inventory module ====
    @Post('create-inventory')
    create(@Body() dto: CreateInventoryDto) {
        return this.adminService.create(dto);
    }

    @Get('fetch-inventory')
    findAll() {
        return this.adminService.findAll();
    }

    @Get('fetch-inventory/:month')
    findByMonth(@Param('month') month: string) {
        return this.adminService.findByMonth(month);
    }

    @Put('update-inventory/:month')
    update(@Param('month') month: string, @Body() dto: UpdateInventoryDto) {
        return this.adminService.update(month, dto);
    }

    @Delete('delete-inventory/:id')
    async removeInventory(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteInventoryRecord(id)
    }

}
