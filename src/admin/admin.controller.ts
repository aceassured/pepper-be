import { BadRequestException, Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Put, Query, Res, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateUserDto } from '../user/dto/create-user-dto';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../user/dto/otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Response } from 'express';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateBlogDto } from '../user/dto/create-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UpdateContactDetailsDto } from './dto/create-contact-info.dto';


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
    async getPaymentDashboardCards(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
        return this.adminService.fetchPaymentDashboardCards(fromDate, toDate)
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

    @Get('fetch-cancelled-order/:page')
    async fetchCancelledOrders(@Param('page', ParseIntPipe) page: number) {
        return this.adminService.fetchAllCancelledPayments(page)
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

    @Put('/update-inventory-status/:id')
    async toggleInventoryStatus(@Param('id', ParseIntPipe) id: number, @Body() { reason }: { reason: string }) {
        return this.adminService.toggleInventoryStatus(id, reason)
    }


    // ==== Start of Blog management module =====


    // ---------- Category ----------
    @Post('create-category')
    async createCategory(@Body() dto: CreateCategoryDto) {
        return this.adminService.createCategory(dto);
    }

    @Get('fetch-all-category')
    async getAllCategories() {
        return this.adminService.getAllCategories();
    }

    @Delete('delete-category/:id')
    async deleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteCategory(id)
    }

    @Delete('delete-tag/:id')
    async deleteTag(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteTag(id);
    }
    // ---------- Tags ----------
    @Post('create-tags')
    async createTag(@Body() dto: CreateTagDto) {
        return this.adminService.createTag(dto);
    }

    @Get('fetch-all-tags')
    async getAllTags() {
        return this.adminService.getAllTags();
    }
    // Create: expects multipart/form-data with fields and optional file field 'thumbnail'
    @Post('create-blog')
    @UseInterceptors(FileInterceptor('thumbnail'))
    async createBlog(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        // ✅ Parse 'category' field
        if (typeof body.category === 'string') {
            try {
                // handle both '["a","b"]' and "['a','b']"
                body.category = JSON.parse(body.category.replace(/'/g, '"'));
            } catch {
                // fallback if parsing fails
                body.category = body.category
                    .replace(/[\[\]']+/g, '')
                    .split(',')
                    .map((item) => item.trim());
            }
        }

        // ✅ Parse 'tags' field
        if (typeof body.tags === 'string') {
            try {
                body.tags = JSON.parse(body.tags.replace(/'/g, '"'));
            } catch {
                body.tags = body.tags
                    .replace(/[\[\]']+/g, '')
                    .split(',')
                    .map((item) => item.trim());
            }
        }

        // Pass to your service
        return this.adminService.createBlog(body, file);
    }



    @Get('fetch-all-blogs')
    async findAllBlogs(@Query('search') search?: string, @Query('category') category?: string, @Query('tags') tags?: string) {
        const parsedCategories = category ? category.split(',') : [];
        const parsedTags = tags ? tags.split(',') : [];
        return this.adminService.findAllBlogs(search, parsedCategories, parsedTags)
    }

    @Get('fetch-blog/:id')
    async findOneBlog(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.findOneBlog(id);
    }

    @Put('update-blog/:id')
    @UseInterceptors(FileInterceptor('thumbnail'))
    async updateBlog(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {

        // ✅ Parse 'category' field
        if (typeof body.category === 'string') {
            try {
                // handle both '["a","b"]' and "['a','b']"
                body.category = JSON.parse(body.category.replace(/'/g, '"'));
            } catch {
                // fallback if parsing fails
                body.category = body.category
                    .replace(/[\[\]']+/g, '')
                    .split(',')
                    .map((item) => item.trim());
            }
        }

        // ✅ Parse 'tags' field
        if (typeof body.tags === 'string') {
            try {
                body.tags = JSON.parse(body.tags.replace(/'/g, '"'));
            } catch {
                body.tags = body.tags
                    .replace(/[\[\]']+/g, '')
                    .split(',')
                    .map((item) => item.trim());
            }
        }

        return this.adminService.updateBlog(id, body, file);
    }

    @Delete('delete-blog/:id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.removeBlog(id);
    }


    // ==== End of Blog management module =====

    //===== Start of meta data management module =====
    @Get('fetch-meta-data')
    async getMeta() {
        return await this.adminService.getMeta();
    }

    @Post('update-meta-data')
    @UseInterceptors(FileInterceptor('image'))
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async updateMeta(
        @Body() body: UpdateMetaDto,
        @UploadedFile() image: Express.Multer.File,
    ) {
        return await this.adminService.updateField(body.option, body.value, image);
    }
    
    //==== End of meta data management module =====


    // ==== Start of Policy management module ====


    @Get('fetch-policy')
    async getPolicy() {
        return this.adminService.getPolicy();
    }

    @Put('update-policy')
    async updatePolicy(@Body() updateDto: UpdatePolicyDto) {
        return this.adminService.updatePolicy(updateDto);
    }

    // ==== End of Policy management module ====


    // ==== Start of Contact management module ====

    @Put('update-contact-details')
    updateSingleField(@Body() dto: UpdateContactDetailsDto) {
        return this.adminService.upsertSingleField(dto);
    }

    @Get('fetch-contact-details')
    getDetails() {
        return this.adminService.getDetails();
    }


    // ==== End of Contact management module ====


}
