// src/orders/dto/create-order.dto.ts
import { Type } from 'class-transformer';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsInt,
    Min,
    IsNumber,
    IsEmail,
    IsEnum,
    IsBoolean,
    Equals,
    Matches,
} from 'class-validator';

import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    productId?: number;

    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsOptional()
    @IsString()
    deliveryBatch?: string;

    @IsOptional()
    @IsString()
    deliveryLocation?: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    // pricePerUnit in **Rupees** accepted from client; server will convert to paise
    @IsNumber()
    @Type(() => Number)
    pricePerUnit: number;

    // customer info
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsEmail()
    email: string;

    // phone in E.164 or simple numeric; adjust Matches() if you have stricter format
    @IsString()
    @Matches(/^\+?\d{7,15}$/, { message: 'phone must be digits, allow optional + and 7-15 chars' })
    phone: string;

    @IsOptional()
    @IsString()
    whatsapp?: string;

    @IsString()
    @IsNotEmpty()
    deliveryAddress: string;

    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsString()
    @IsNotEmpty()
    pincode: string;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    // user must accept terms
    @IsBoolean()
    @Equals(true, { message: 'termsAccepted must be true' })
    termsAccepted: boolean;

    // optional: if you want to accept coupon/metadata
    @IsOptional()
    metadata?: Record<string, any>;
}
