// src/orders/orders.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // your Prisma service
import { CreateOrderDto } from './dto/create-order.dto';
import Razorpay from 'razorpay';
import { catchBlock } from '../common/CatchBlock';
import { RefundStatus } from '@prisma/client';
import { sendAdminNewOrderEmail, sendCustomerOrderConfirmation } from '../common/sendOrderEmails';

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
        try {
            const totalAmountInPaise = Math.floor(Number(dto.pricePerUnitInPaise) * Number(dto.quantity) * 100);
            // 1️⃣ Create Razorpay order
            const razorpayOrder = await this.razorpay.orders.create({
                amount: totalAmountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
                payment_capture: true,
            }) as any;

            const currentYear = new Date().getFullYear();

            // 1️⃣ Get the most recently created order
            const lastOrder = await this.prisma.order.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { orderId: true },
            });

            let nextNumber = 1;

            if (lastOrder && lastOrder.orderId) {
                // Match "KP<year>-<number>" with variable length number
                const match = lastOrder.orderId.match(/^KP(\d{4})-(\d+)$/);

                if (match) {
                    const lastYear = parseInt(match[1]);
                    const lastNum = parseInt(match[2]);

                    if (lastYear === currentYear) {
                        // Same year → increment last number
                        nextNumber = lastNum + 1;
                    } else {
                        // New year → reset counter
                        nextNumber = 1;
                    }
                }
            }

            // 2️⃣ Format number with leading zeros (at least 4 digits)
            const nextNumberStr = nextNumber.toString().padStart(4, '0');

            // 3️⃣ Combine parts into final format
            const newOrderId = `KP${currentYear}-${nextNumberStr}`;


            // 2️⃣ Save order in DB
            const order = await this.prisma.order.create({
                data: {
                    user: {
                        connect: {
                            id: userId
                        }
                    },
                    orderId: newOrderId,
                    productName: dto.productName,
                    productId: dto.productId,
                    deliveryDate: dto.deliveryDate,
                    deliveryLocation: dto.deliveryLocation,
                    quantity: dto.quantity,
                    pricePerUnitInPaise: dto.pricePerUnitInPaise,
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
                    areaName: dto.areaName,
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

            // ✅ Create initial Progress Tracker record (all pending)
            await this.prisma.progressTracker.create({
                data: {
                    order: {
                        connect: {
                            id: order.id
                        }
                    },
                    orderConfirmedStatus: 'PENDING',
                    nurseryAllocationStatus: 'PENDING',
                    growthPhaseStatus: 'PENDING',
                    readyForDispatchStatus: 'PENDING',
                    deliveredStatus: 'PENDING',
                    currentStage: null,
                    progressPercentage: 0,
                },
            });


            // console.log('New Order', await this.prisma.order.findUnique({ where: { id: order.id }, include: { payment: true, progressTracker: true } }));
            const settings = await this.prisma.settings.findFirst();
            if (settings?.newBookings) {
                sendAdminNewOrderEmail(await this.prisma.order.findUnique({ where: { id: order.id }, include: { payment: true, progressTracker: true } }))
            }

            return {
                order,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmountInPaise,
                currency: 'INR',
            };
        } catch (error) {
            catchBlock(error)
        }
    }

    // Fetch all orders for a user with payment details
    async getUserOrders(userId: number) {
        try {
            const orders = await this.prisma.order.findMany({
                where: {
                    AND: [
                        { userId: userId },
                        { status: "PAID" }
                    ]
                },
                include: { payment: true, progressTracker: true, refund: true },
                orderBy: { createdAt: 'desc' },
            });
            return orders;
        } catch (error) {
            catchBlock(error)
        }
    }

    // Verify payment after checkout
    async verifyPayment(orderId: number, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) {
        try {
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

            sendCustomerOrderConfirmation(await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, progressTracker: true } }))
            const settings = await this.prisma.settings.findFirst();
            if (settings?.paymentConfirmations) {
                sendAdminNewOrderEmail(await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, progressTracker: true } }))
            }

            return updatedOrder;
        } catch (error) {
            catchBlock(error)
        }
    }

    // Update payment status from webhook
    async updatePaymentStatusFromWebhook(razorpayOrderId: string, razorpayPaymentId: string, status: string) {
        try {
            const order = await this.prisma.order.findFirst({
                where: {
                    payment: {
                        razorpayOrderId: razorpayOrderId, // find by related payment
                    },
                },
                include: { payment: true },
            });

            if (!order) {
                throw new Error("Order not found for this Razorpay order ID");
            }

            await this.prisma.order.update({
                where: { id: order.id }, // ✅ use a unique field
                data: {
                    status: "PAID",
                    payment: {
                        update: {
                            razorpayPaymentId: razorpayPaymentId,
                            status: "CAPTURED",
                        },
                    },
                },
                include: { payment: true },
            });

            // ✅ Now update ProgressTracker after payment confirmation
            await this.prisma.progressTracker.update({
                where: { orderId: order.id },
                data: {
                    orderConfirmedStatus: 'COMPLETED',
                    orderConfirmedStart: order.createdAt,
                    orderConfirmedEnd: new Date(),
                    nurseryAllocationStatus: 'IN_PROGRESS',
                    nurseryAllocationStart: new Date(),
                    currentStage: 'NURSERY_ALLOCATION',
                    progressPercentage: 20, // optional
                },
            });

        } catch (error) {
            catchBlock(error)
        }
    }

    // Request the refund for a specific order
    async refundRequest(id: number) {
        try {
            const order = await this.prisma.order.findUnique({ where: { id } }) || (() => { throw new BadRequestException("No order found with the id") })()

            const updatedOrder = await this.prisma.order.update({
                where: { id },
                data: {
                    status: 'REFUNDED',
                    refundRequestDate: new Date(),
                    refundStatus: 'PENDING'
                },
                include: { payment: true, progressTracker: true, refund: true }
            })

            return { message: "Refund request raised successfully!", order: updatedOrder }

        } catch (error) {
            catchBlock(error)
        }
    }

    // Update the refund status based on the webhook
    async handleWebhookEvent(event: string, refund: any) {
        const statusMap: Record<string, RefundStatus> = {
            'refund.created': RefundStatus.INITIATED,
            'refund.processed': RefundStatus.PROCESSING,
            'refund.failed': RefundStatus.FAILED,
            'refund.completed': RefundStatus.SUCCESS,
        };

        const mappedStatus = statusMap[event];
        if (!mappedStatus) return;

        await this.prisma.refund.updateMany({
            where: { refundId: refund.id },
            data: {
                status: mappedStatus,
                processedAt:
                    mappedStatus === RefundStatus.PROCESSING ? new Date() : undefined,
                completedAt:
                    mappedStatus === RefundStatus.SUCCESS ? new Date() : undefined,
                failureReason:
                    mappedStatus === RefundStatus.FAILED
                        ? refund.failure_reason || 'Unknown'
                        : undefined,
                metadata: refund,
            },
        });
    }


}
