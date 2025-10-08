// src/payments/dto/verify-payment.dto.ts
import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyPaymentDto {
  // Razorpay fields you will get from client after Checkout success
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  // your internal DB order id
  @IsInt()
  @Type(() => Number)
  orderId: number;
}
