// src/orders/orders.controller.ts
import { Controller, Post, Body, Get, Param, Req, Res, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import * as crypto from 'crypto';


@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post(':userId')
  createOrder(@Param('userId',ParseIntPipe) userId: number, @Body() dto: CreateOrderDto) {
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

    return { status: HttpStatus.OK, message: 'Webhook received' };
  }


}
