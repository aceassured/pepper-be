// src/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // your Prisma service
import { CreateOrderDto } from './dto/create-order.dto';
import Razorpay from 'razorpay';

@Injectable()
export class OrdersService {
    private razorpay: Razorpay;

    constructor(private prisma: PrismaService) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    // Create order + Razorpay order
    async createOrder(userId: number, dto: CreateOrderDto) {
        const totalAmountInPaise = dto.pricePerUnit * dto.quantity * 100;

        // 1️⃣ Create Razorpay order
        const razorpayOrder = await this.razorpay.orders.create({
            amount: totalAmountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: true,
        }) as any;

        // 2️⃣ Save order in DB
        const order = await this.prisma.order.create({
            data: {
                user: {
                    connect: {
                        id: userId
                    }
                },
                productName: dto.productName,
                productId: dto.productId,
                deliveryBatch: dto.deliveryBatch,
                deliveryLocation: dto.deliveryLocation,
                quantity: dto.quantity,
                pricePerUnitInPaise: Math.round(dto.pricePerUnit * 100),
                totalAmountInPaise,
                currency: 'INR',
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                whatsapp: dto.whatsapp,
                deliveryAddress: dto.deliveryAddress,
                state: dto.state,
                district: dto.district,
                pincode: dto.pincode,
                paymentMethod: dto.paymentMethod,
                termsAccepted: dto.termsAccepted,
                status: 'PENDING',
                payment: {
                    create: {
                        provider: 'razorpay',
                        razorpayOrderId: razorpayOrder.id,
                        amountInPaise: totalAmountInPaise,
                        currency: 'INR',
                        status: 'CREATED',
                    },
                },
            },
            include: {
                payment: true,
            },
        });

        return {
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmountInPaise,
            currency: 'INR',
        };
    }

    // Fetch all orders for a user with payment details
    async getUserOrders(userId: number) {
        const orders = await this.prisma.order.findMany({
            where: { userId },
            include: { payment: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders;
    }

    // Verify payment after checkout
    async verifyPayment(orderId: number, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) {
        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            throw new Error('Invalid signature');
        }

        // update payment and order status
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                payment: {
                    update: {
                        status: 'CAPTURED',
                        razorpayPaymentId,
                        razorpaySignature,
                    },
                },
            },
            include: { payment: true },
        });

        return updatedOrder;
    }

    async updatePaymentStatusFromWebhook(razorpayOrderId: string, razorpayPaymentId: string, status: string) {
        // Update the order and payment based on razorpayOrderId
        const updatedOrder = await this.prisma.order.update({
            where: {
                payment: {
                    razorpayOrderId: razorpayOrderId,
                },
            },
            data: {
                status: 'PAID',
                payment: {
                    update: {
                        razorpayPaymentId,
                        status,
                    },
                },
            },
            include: {
                payment: true,
            },
        });

        return updatedOrder;
    }

}
