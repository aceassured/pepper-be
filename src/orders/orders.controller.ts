// src/orders/orders.controller.ts
import { Controller, Post, Body, Get, Param, Req, Res, HttpStatus, ParseIntPipe, Put, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import * as crypto from 'crypto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RefundRequestDto } from './dto/refund-request.dto';


@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post(':userId')
  createOrder(@Param('userId', ParseIntPipe) userId: number, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(Number(userId), dto);
  }

  @Get(':userId')
  getUserOrders(@Param('userId') userId: string) {
    return this.ordersService.getUserOrders(Number(userId));
  }

  @Post('verify/:orderId')
  verifyPayment(
    @Param('orderId') orderId: string,
    @Body() body: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string },
  ) {
    return this.ordersService.verifyPayment(
      Number(orderId),
      body.razorpayPaymentId,
      body.razorpayOrderId,
      body.razorpaySignature,
    );
  }

  @Post('webhook/razorpay')
  async handleWebhook(@Req() req: Request) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not defined');
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body as any;

    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (generatedSignature !== signature) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid signature' };
    }

    const event = body.event;
    const payload = body.payload;

    if (event === 'payment.captured') {
      const paymentId = payload.payment.entity.id;
      const razorpayOrderId = payload.payment.entity.order_id;
      await this.ordersService.updatePaymentStatusFromWebhook(
        razorpayOrderId,
        paymentId,
        'CAPTURED',
      );
    }

    // --- 2️⃣ Handle Refund Events ---
    if (event.startsWith('refund.')) {
      const refundEntity = payload.refund?.entity;
      if (refundEntity) {
        await this.ordersService.handleWebhookEvent(event, refundEntity);
      }
    }

    return { status: HttpStatus.OK, message: 'Webhook received' };
  }

  @Put('refund-request/:id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file - adjust as needed
      // You can add fileFilter to restrict MIME types (image/png, image/jpeg etc)
    }),
  )
  async raiseRefundRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RefundRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // if (!body || !body.reason) {
    //   throw new BadRequestException('Refund reason is required');
    // }

    return this.ordersService.refundRequest(id, body, files || []);
  }

  @Put('cancel-request/:id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file - adjust as needed
      // You can add fileFilter to restrict MIME types (image/png, image/jpeg etc)
    }),
  )
  async raiseCancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RefundRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // if (!body || !body.reason) {
    //   throw new BadRequestException('Refund reason is required');
    // }

    return this.ordersService.raiseCancelRequest(id, body, files || []);
  }

  // Recent booking for dahsboard
  @Get('recent-orders')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

}
