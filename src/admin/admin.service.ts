import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/CatchBlock';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../user/dto/otp.dto';
import { sendOtpToUser } from '../common/send-otp';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, StageStatus, StageType } from '@prisma/client';
import * as puppeteer from 'puppeteer';
import { buildInvoiceHtml } from '../common/invoice.template';


@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) { }

    // Admin login
    async adminLogin(dto: LoginAdminDto) {
        try {
            const admin = await this.prisma.admin.findFirst({ where: { email: dto.email } }) || (() => { throw new BadRequestException('Invalid credentails') })()

            if (admin.password !== dto.password) {
                console.log(admin.password, dto.password)
                throw new BadRequestException('Enter a valid password')
            }

            const payload = { id: admin.id, email: admin.email }

            const token = await this.jwt.sign(payload)

            const loginDetails = {
                ...admin,
                isAdmin: true,
                token
            }

            return { message: 'Login successfull', user: loginDetails }

        } catch (error) {
            catchBlock(error);
        }
    }

    // 🔹 Send OTP
    async sendOtp(dto: SendOtpDto) {
        try {
            const user = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');

            const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

            // Update user with OTP
            await this.prisma.admin.update({
                where: { email: dto.email },
                data: { otp, expiresAt },
            });

            sendOtpToUser(dto.email, otp); // your existing send function

            return { message: 'OTP sent successfully' };
        } catch (error) {
            catchBlock(error);
        }
    }

    // 🔹 Verify OTP
    async verifyOtp(dto: VerifyOtpDto) {
        try {
            const user = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');
            if (!user.otp || !user.expiresAt)
                throw new BadRequestException('OTP not generated');

            if (user.otp !== dto.otp)
                throw new UnauthorizedException('Invalid OTP');

            if (new Date() > user.expiresAt)
                throw new BadRequestException('OTP expired');

            // Clear OTP after successful verification
            await this.prisma.admin.update({
                where: { email: dto.email },
                data: { otp: null, expiresAt: null },
            });

            return { message: 'OTP verified successfully' };
        } catch (error) {
            catchBlock(error);
        }
    }

    // 🔹 Reset Password
    async resetPassword(dto: ResetPasswordDto) {
        try {
            const user = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');

            if (user.password === dto.password) {
                throw new BadRequestException('New password must be different from old password')
            }

            await this.prisma.admin.update({
                where: { email: dto.email },
                data: {
                    password: dto.password,
                    otp: null,
                    expiresAt: null,
                },
            });

            return { message: 'Password reset successfully' };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Edit profile details
    async editProfile(dto: UpdateProfileDto) {
        try {
            const user = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');

            if (user.password === dto.password) {
                throw new BadRequestException('New password must be different from old password')
            }

            const updatedProfile = await this.prisma.admin.update({
                where: { email: dto.email },
                data: {
                    name: dto.name,
                    password: dto.password
                },
            });

            return { message: 'Profile updated successfully', updatedProfile };
        } catch (error) {
            catchBlock(error)
        }
    }


    // ==== Start Location Management ====

    //Add new location
    async createLocation(dto: CreateLocationDto) {
        try {
            const existed = await this.prisma.location.findFirst({ where: { state: dto.state, district: dto.district } })
            if (existed) throw new BadRequestException('Location already exists')

            const newLocation = await this.prisma.location.create({
                data: {
                    ...dto
                }
            })
            return { message: 'New location added successfully!', newLocation }
        } catch (error) {
            catchBlock(error)
        }
    }

    //Edit location details
    async editLocation(id: number, dto: CreateLocationDto) {
        try {
            await this.prisma.location.findFirst({ where: { id } }) || (() => { throw new BadRequestException('No location with the id') })()

            const updatedLocation = await this.prisma.location.update({
                where: { id },
                data: {
                    ...dto
                }
            })

            return { message: "Location updated successfully", updatedLocation }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Get all states
    async fetchStates() {
        try {
            const allStates = await this.prisma.location.findMany({
                distinct: ['state'], // ensures unique state values
                select: {
                    state: true,
                },
            });

            // Convert from [{ state: 'X' }, { state: 'Y' }] → ['X', 'Y']
            const states = allStates.map((item: any) => item.state);

            return { message: 'Showing all unique states', states };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Get all districts
    async fetchDistricts(state: string) {
        try {
            const data = await this.prisma.location.findMany({
                where: {
                    state: {
                        equals: state,
                        mode: 'insensitive',
                    }
                }
            })
            return { message: 'Showing all the locations data', data }
        } catch (error) {
            catchBlock(error)
        }
    }

    // // Fetch all locations
    // async fetchAllLocations(page: number, search: string, state: string, district: string) {
    //     try {
    //         const skip = (page * 5) - 5;
    //         const limit = 5

    //         let locations: any;
    //         let totalCount: number;

    //         locations = await this.prisma.location.findMany({
    //             skip: skip, take: limit, orderBy: {
    //                 createdAt: 'desc'
    //             }
    //         })

    //         totalCount = await this.prisma.location.count();

    //         if (search) {
    //             locations = await this.prisma.location.findMany({
    //                 where: {
    //                     OR: [
    //                         { state: { contains: search, mode: 'insensitive' } },
    //                         { district: { contains: search, mode: 'insensitive' } },
    //                     ]
    //                 },
    //                 skip: skip, take: limit, orderBy: {
    //                     createdAt: 'desc'
    //                 }
    //             })
    //             totalCount = await this.prisma.location.count({
    //                 where: {
    //                     OR: [
    //                         { state: { contains: search, mode: 'insensitive' } },
    //                         { district: { contains: search, mode: 'insensitive' } },
    //                     ]
    //                 },
    //             })
    //         }

    //         if (state) {
    //             locations = await this.prisma.location.findMany({
    //                 where: {
    //                     state: { contains: state, mode: 'insensitive' }
    //                 }
    //             })
    //             totalCount = await this.prisma.location.count({
    //                 where: {
    //                     state: { contains: state, mode: 'insensitive' }
    //                 }
    //             })
    //         }

    //         if (district) {
    //             locations = await this.prisma.location.findMany({
    //                 where: {
    //                     district: { contains: district, mode: 'insensitive' }
    //                 }
    //             })
    //             totalCount = await this.prisma.location.count({
    //                 where: {
    //                     district: { contains: district, mode: 'insensitive' }
    //                 }
    //             })
    //         }

    //         if (search && state && district) {
    //             locations = await this.prisma.location.findMany({
    //                 where: {

    //                 }
    //             })
    //         }


    //         const allDetails = {
    //             locations,
    //             totalCount: totalCount,
    //             currentPage: page,
    //             totalPages: Math.ceil(locations.length / limit) ?? 1,
    //             perPage: limit
    //         }

    //         return { message: "Showing all the locations", locations: allDetails }
    //     } catch (error) {
    //         catchBlock(error)
    //     }
    // }

    // Fetch all locations
    async fetchAllLocations(page: number, search?: string, state?: string, status?: boolean) {
        try {
            const limit = 5;
            const skip = (page - 1) * limit;

            // Build dynamic filter
            const where: any = {};

            // Add search (matches either state or district)
            if (search) {
                where.OR = [
                    { state: { contains: search, mode: 'insensitive' } },
                    { district: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Add state filter
            if (state) {
                where.state = { contains: state, mode: 'insensitive' };
            }

            // Add active status filter
            if (status) {
                if (typeof status === 'boolean') {
                    where.isActive = status;
                }
            }

            // Fetch filtered locations with pagination
            const [locations, totalCount] = await Promise.all([
                this.prisma.location.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.location.count({ where }),
            ]);

            const allDetails = {
                locations,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit) || 1,
                perPage: limit,
            };

            return { message: 'Showing all the locations', locations: allDetails };
        } catch (error) {
            catchBlock(error);
        }
    }

    async downloadLocations() {
        try {
            const locations = await this.prisma.location.findMany({ orderBy: { createdAt: 'asc' } })

            return { message: 'Downloading all locations data', locations }
        } catch (error) {
            catchBlock(error)
        }
    }

    //Delete location
    async deleteLocation(id: number) {
        try {
            await this.prisma.location.findFirst({ where: { id } }) || (() => { throw new BadRequestException('No location with the id') })()
            await this.prisma.location.delete({ where: { id } })

            return { message: 'Location deleted successfully' }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Handle location status (active/inactive)

    async toggleLocationStatus(id: number) {
        try {
            const location = await this.prisma.location.findUnique({ where: { id } }) || (() => { throw new BadRequestException('No location with the id') })()

            const updatedLocation = await this.prisma.location.update({
                where: { id },
                data: { isActive: !location.isActive }
            })
            return { message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`, location: updatedLocation }
        } catch (error) {
            catchBlock(error)
        }
    }

    // ==== End Location Management ====

    // ==== Start Order Management ====

    // async fetchAllOrders(page: number, search: string, status: string, startDate: string, endDate: string, state: string) {
    //     try {
    //         const limit = 5;
    //         const skip = (page - 1) * limit;

    //         let orders: any;
    //         let totalCount: number;

    //         orders = await this.prisma.order.findMany({
    //             skip: skip, take: limit, orderBy: {
    //                 createdAt: 'desc'
    //             }
    //         })
    //         totalCount = await this.prisma.order.count();

    //         if (search) {
    //             orders = await this.prisma.order.findMany({
    //                 where: {
    //                     OR: [
    //                         { fullName: { contains: search, mode: 'insensitive' } },
    //                         { phone: { contains: search, mode: 'insensitive' } },
    //                         { deliveryAddress: { contains: search, mode: 'insensitive' } }
    //                     ]
    //                 },
    //                 skip: skip, take: limit, orderBy: {
    //                     createdAt: 'desc'
    //                 }
    //             })
    //             totalCount = await this.prisma.order.count({
    //                 where: {
    //                     OR: [
    //                         { fullName: { contains: search, mode: 'insensitive' } },
    //                         { phone: { contains: search, mode: 'insensitive' } },
    //                         { deliveryAddress: { contains: search, mode: 'insensitive' } }
    //                     ]
    //                 },
    //             })
    //         }

    //         if (status) {
    //             const stage = status as StageType;
    //             const statusValue = Object.values(StageType)?.includes(stage) ? status : null;
    //             if (!statusValue) throw new BadRequestException('Invalid status value')

    //             orders = await this.prisma.order.findMany({
    //                 where: {
    //                     progressTracker: {
    //                         currentStage: statusValue
    //                     }
    //                 },
    //                 skip: skip, take: limit, orderBy: {
    //                     createdAt: 'desc'
    //                 }
    //             })
    //             totalCount = await this.prisma.order.count({
    //                 where: {
    //                     progressTracker: {
    //                         currentStage: statusValue
    //                     }
    //                 },
    //             })
    //         }

    //         if (startDate && endDate) {
    //             const start = new Date(startDate);
    //             const end = new Date(endDate);

    //             orders = await this.prisma.order.findMany({
    //                 where: {
    //                     deliveryDate: {
    //                         AND: [
    //                             { gte: start },
    //                             { lte: end }
    //                         ]
    //                     }
    //                 },
    //                 skip: skip, take: limit, orderBy: {
    //                     createdAt: 'desc'
    //                 }
    //             })

    //             totalCount = await this.prisma.order.count({
    //                 where: {
    //                     deliveryDate: {
    //                         AND: [
    //                             { gte: start },
    //                             { lte: end }
    //                         ]
    //                     }
    //                 }
    //             })
    //         }

    //         if (state) {
    //             orders = await this.prisma.order.findMany({
    //                 where: {
    //                     state: {
    //                         contains: state,
    //                         mode: 'insensitive'
    //                     }
    //                 },
    //                 skip: skip, take: limit, orderBy: {
    //                     createdAt: 'desc'
    //                 }
    //             })

    //             totalCount = await this.prisma.order.count({
    //                 where: {
    //                     state: {
    //                         contains: state,
    //                         mode: 'insensitive'
    //                     }
    //                 }
    //             })
    //         }

    //         const orderDetails = {
    //             orders,
    //             totalCount: totalCount,
    //             currentPage: page,
    //             totalPages: Math.ceil(totalCount / limit) || 1,
    //             perPage: limit
    //         }

    //         return { message: "Showing all the orders", orders: orderDetails }

    //     } catch (error) {
    //         catchBlock(error)
    //     }
    // }


    // Fetch all orders with advanced filtering and pagination
    async fetchAllOrders(
        page: number,
        search?: string,
        status?: string,
        startDate?: string,
        endDate?: string,
        state?: string
    ) {
        try {
            const limit = 5;
            const skip = (page - 1) * limit;

            // Build dynamic Prisma filter
            const where: any = {};

            // Search filter (matches multiple fields)
            if (search) {
                where.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { deliveryAddress: { contains: search, mode: 'insensitive' } },
                    { orderId: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Status filter (nested inside progressTracker)
            if (status) {
                const stage = status as StageType;
                const statusValue = Object.values(StageType).includes(stage) ? stage : null;
                if (!statusValue) throw new BadRequestException('Invalid status value');

                where.progressTracker = {
                    some: {
                        currentStage: statusValue,
                    },
                };
            }

            // Date range filter
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.deliveryDate = {
                    gte: start,
                    lte: end,
                };
            }

            // State filter (partial match)
            if (state) {
                where.state = { contains: state, mode: 'insensitive' };
            }

            // Fetch filtered orders with pagination
            const [orders, totalCount] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        progressTracker: true, // keep your relation data
                    },
                }),
                this.prisma.order.count({ where }),
            ]);

            const orderDetails = {
                orders,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit) || 1,
                perPage: limit,
            };

            return { message: 'Showing all the orders', orders: orderDetails };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Delete order
    async deleteOrder(id: number) {
        try {
            await this.prisma.order.findFirst({ where: { id } }) || (() => { throw new BadRequestException('No order with the id') })()
            await this.prisma.order.delete({ where: { id } })

            return { message: 'Order deleted successfully' }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Update the order status
    async updateOrderStatus(id: number, status: string) {
        try {
            // Check if order exists
            const orderExists = await this.prisma.order.findFirst({ where: { id } });
            if (!orderExists) throw new BadRequestException('No order found with the given id');

            // Valid next statuses after nursery allocation
            const validStatuses = ['GROWTH_PHASE', 'READY_FOR_DISPATCH', 'DELIVERED'];
            const isValidStatus = validStatuses.includes(status) ? (status as StageType) : null;

            if (!isValidStatus)
                throw new BadRequestException(
                    'Invalid status value. Status must be one of: GROWTH_PHASE, READY_FOR_DISPATCH, DELIVERED'
                );

            // Update based on the stage
            switch (isValidStatus) {
                case 'GROWTH_PHASE':
                    await this.prisma.progressTracker.update({
                        where: { orderId: id },
                        data: {
                            nurseryAllocationStatus: 'COMPLETED',
                            nurseryAllocationEnd: new Date(),
                            growthPhaseStatus: 'IN_PROGRESS',
                            growthPhaseStart: new Date(),
                            currentStage: 'GROWTH_PHASE',
                            progressPercentage: 40,
                        },
                    });
                    break;

                case 'READY_FOR_DISPATCH':
                    await this.prisma.progressTracker.update({
                        where: { orderId: id },
                        data: {
                            growthPhaseStatus: 'COMPLETED',
                            growthPhaseEnd: new Date(),
                            readyForDispatchStatus: 'IN_PROGRESS',
                            readyForDispatchStart: new Date(),
                            currentStage: 'READY_FOR_DISPATCH',
                            progressPercentage: 70,
                        },
                    });
                    break;

                case 'DELIVERED':
                    await this.prisma.progressTracker.update({
                        where: { orderId: id },
                        data: {
                            readyForDispatchStatus: 'COMPLETED',
                            readyForDispatchEnd: new Date(),
                            deliveredStatus: 'COMPLETED',
                            deliveredStart: new Date(),
                            deliveredEnd: new Date(),
                            currentStage: 'DELIVERED',
                            progressPercentage: 100,
                        },
                    });
                    break;

                default:
                    throw new BadRequestException('Invalid status value');
            }

            // Return updated order with related data
            const updatedOrder = await this.prisma.order.findUnique({
                where: { id },
                include: { payment: true, progressTracker: true },
            });

            return {
                message: 'Order status updated successfully',
                updatedOrder,
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    // ==== End Order Management ====

    // ==== Start of payment managment ====

    //Fetch all the card details for payment dashboard
    async fetchPaymentDashboardCards() {
        try {
            const currentDate = new Date();
            const startDate = new Date(currentDate);
            startDate.setMonth(currentDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            // Run queries in parallel for better performance
            const [completedOrders, pendingOrders] = await Promise.all([
                this.prisma.order.findMany({
                    where: {
                        status: 'PAID',
                        createdAt: { gte: startDate, lte: endDate },
                    },
                    select: { totalAmountInPaise: true },
                }),
                this.prisma.order.findMany({
                    where: {
                        status: 'PENDING',
                        createdAt: { gte: startDate, lte: endDate },
                    },
                    select: { id: true },
                }),
            ]);

            // Calculate total revenue from completed payments
            const totalRevenue = completedOrders.reduce(
                (acc, order) => acc + order.totalAmountInPaise,
                0
            );

            // Prepare card data
            const cards = [
                {
                    title: 'Total Revenue',
                    amount: totalRevenue,
                },
                {
                    title: 'Successful Payments',
                    amount: completedOrders.length || 0,
                },
                {
                    title: 'Pending Payments',
                    amount: pendingOrders.length || 0,
                },
                {
                    title: 'Total Refunded',
                    amount: 0, // Placeholder for future logic
                },
            ];

            return {
                message: 'Showing all the payment dashboard cards',
                cards,
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Fetch all the payment transcation details
    async fetchAllPaymentTransactions(
        page: number,
        search?: string,
        status?: string,
        fromDate?: string,
        toDate?: string
    ) {
        try {
            const limit = 5;
            const currentPage = Math.max(page || 1, 1);
            const skip = (currentPage - 1) * limit;

            const where: any = {};

            // 🔍 Search filter (partial match)
            if (search?.trim()) {
                where.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { orderId: { contains: search, mode: 'insensitive' } },
                ];
            }

            // ⚙️ Status filter (enum-safe)
            if (status) {
                const statusOption = status.toUpperCase() as OrderStatus;
                if (!Object.values(OrderStatus).includes(statusOption)) {
                    throw new BadRequestException('Please enter a valid status option');
                }
                where.status = statusOption;
            }

            // 📅 Date range filter
            if (fromDate && toDate) {
                const startDate = new Date(fromDate);
                const endDate = new Date(toDate);
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    throw new BadRequestException('Invalid date format provided');
                }
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

                where.createdAt = { gte: startDate, lte: endDate };
            }

            // ⚡ Fetch data + count concurrently
            const [allOrders, totalCount] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        payment: true,
                        progressTracker: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.order.count({ where }),
            ]);

            const totalPages = Math.ceil(totalCount / limit) || 1;

            const orderDetails = {
                allOrders,
                totalCount,
                currentPage,
                totalPage: totalPages,
                perPage: limit,
            };

            return {
                message: 'Showing all the order transactions',
                allOrders: orderDetails,
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    // async generateInvoicePdfBuffer(orderId: number) {
    //     // fetch order with related payment and progressTracker
    //     const order = await this.prisma.order.findUnique({
    //         where: { id: orderId },
    //         include: { payment: true, progressTracker: true },
    //     });

    //     if (!order) {
    //         throw new NotFoundException('Order not found');
    //     }

    //     const html = buildInvoiceHtml(order);

    //     // Launch puppeteer
    //     const browser = await puppeteer.launch({
    //         args: ['--no-sandbox', '--disable-setuid-sandbox'],
    //         // headless: true by default
    //     });
    //     try {
    //         const page = await browser.newPage();

    //         // Set a reasonable viewport so layout matches expected
    //         await page.setViewport({ width: 1200, height: 800 });

    //         // Set content and wait until network idle so images load
    //         await page.setContent(html, { waitUntil: 'networkidle0' });

    //         // Generate PDF buffer
    //         const pdfBuffer = await page.pdf({
    //             format: 'A4',
    //             printBackground: true,
    //             margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    //         });

    //         return pdfBuffer;
    //     } catch (error) {
    //         catchBlock(error)
    //     } finally {
    //         await browser.close();
    //     }
    // }

    async fetchAllEnumValue() {
        try {
            const paymentMethods = Object.values(PaymentMethod)
            const orderPaymentStatus = Object.values(OrderStatus)
            const paymentOrderStatus = Object.values(PaymentStatus)
            const stageTypes = Object.values(StageType)
            const stateStatus = Object.values(StageStatus)

            const enumValues = {
                paymentMethods,
                orderPaymentStatus,
                paymentOrderStatus,
                stageTypes,
                stateStatus
            }

            return { message: "Showing all the list of enum values", enumValues }
        } catch (error) {
            catchBlock(error)
        }
    }

}
