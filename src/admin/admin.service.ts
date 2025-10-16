import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/CatchBlock';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../user/dto/otp.dto';
import { sendOtpToUser } from '../common/send-otp';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OrderRefundStatus, OrderStatus, PaymentMethod, PaymentStatus, RefundStatus, StageStatus, StageType, ValidSettings } from '@prisma/client';
import Razorpay from 'razorpay';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { contains } from 'class-validator';


@Injectable()
export class AdminService {
    private razorpay: Razorpay;
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

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
            const where: any = { status: "PAID" };

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

    // add order as the bluk upload through admin
    async bulkOrder(dto: CreateOrderDto) {
        try {
            const totalAmountInPaise = Math.floor(Number(dto.pricePerUnitInPaise) * Number(dto.quantity) * 100);

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

            const newOrder = await this.prisma.order.create({
                data: {
                    ...dto,
                    orderId: newOrderId,
                    status: 'PAID',
                    totalAmountInPaise: totalAmountInPaise,
                    isBulkUpload: true
                },
                include: { progressTracker: true }
            })

            // ✅ Create initial Progress Tracker record (all pending)
            await this.prisma.progressTracker.create({
                data: {
                    order: {
                        connect: {
                            id: newOrder.id
                        }
                    },
                    orderConfirmedStatus: 'COMPLETED',
                    orderConfirmedStart: newOrder.createdAt,
                    orderConfirmedEnd: new Date(),
                    nurseryAllocationStatus: 'IN_PROGRESS',
                    nurseryAllocationStart: new Date(),
                    growthPhaseStatus: 'PENDING',
                    readyForDispatchStatus: 'PENDING',
                    deliveredStatus: 'PENDING',
                    currentStage: 'NURSERY_ALLOCATION',
                    progressPercentage: 20,
                },
            });

            return { message: 'New bulk order created successfully!', order: newOrder }

        } catch (error) {
            catchBlock(error)
        }
    }

    // ==== End Order Management ====

    // ==== Start of payment managment ====

    //Fetch all the card details for payment dashboard
    async fetchPaymentDashboardCards(fromDate?: string, toDate?: string) {
        try {
            let startDate: Date;
            let endDate: Date;

            if (fromDate && toDate && !isNaN(Date.parse(fromDate)) && !isNaN(Date.parse(toDate))) {
                startDate = new Date(fromDate);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
            } else {
                const now = new Date();
                startDate = new Date(new Date().setMonth(now.getMonth() - 1));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
            }

            const [completedOrders, pendingCount] = await Promise.all([
                this.prisma.order.findMany({
                    where: {
                        status: 'PAID',
                        createdAt: { gte: startDate, lte: endDate },
                    },
                    select: { totalAmountInPaise: true },
                }),
                this.prisma.order.count({
                    where: {
                        status: 'PENDING',
                        createdAt: { gte: startDate, lte: endDate },
                    },
                }),
            ]);

            const totalRevenue = completedOrders.reduce(
                (sum, o) => sum + o.totalAmountInPaise,
                0,
            );

            const cards = [
                { title: 'Total Revenue', amount: totalRevenue },
                { title: 'Successful Payments', amount: completedOrders.length },
                { title: 'Pending Payments', amount: pendingCount },
                { title: 'Total Refunded', amount: 0 }, // placeholder
            ];

            return { message: 'Showing all the payment dashboard cards', cards };
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

    // Fetch all enum values
    async fetchAllEnumValue() {
        try {
            const paymentMethods = Object.values(PaymentMethod)
            const orderPaymentStatus = Object.values(OrderStatus)
            const paymentOrderStatus = Object.values(PaymentStatus)
            const orderRefundTrackingStatus = Object.values(OrderRefundStatus)
            const stageTypes = Object.values(StageType)
            const stateStatus = Object.values(StageStatus)
            const refundStatus = Object.values(RefundStatus)
            const validSettings = Object.values(ValidSettings)


            const enumValues = {
                paymentMethods,
                orderPaymentStatus,
                paymentOrderStatus,
                orderRefundTrackingStatus,
                stageTypes,
                stateStatus,
                refundStatus,
                validSettings
            }

            return { message: "Showing all the list of enum values", enumValues }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Fetch a specific order details
    async fetchSpecificOrderDetails(id: number) {
        try {

            const order = await this.prisma.order.findUnique({ where: { id }, include: { payment: true, progressTracker: true } })

            return { message: `Showing the specific order data of order ${id}`, order }

        } catch (error) {
            catchBlock(error)
        }
    }

    //==== refund management ====

    // Fetch cards data for refund dashboard
    async fetchRefundDashboardCards(fromDate?: string, toDate?: string) {
        try {
            // Define date filter
            let dateFilter: any = {};
            if (fromDate && toDate) {
                const startDate = new Date(fromDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);

                dateFilter = {
                    gte: startDate,
                    lte: endDate,
                };
            }

            // Run all counts in parallel
            const [totalRequests, pendingRequests, approvedRequests, cancelledRequests] =
                await Promise.all([
                    // 1️⃣ Total refund requests (orders with REFUNDED status)
                    this.prisma.order.count({
                        where: {
                            status: 'REFUNDED',
                            ...(dateFilter.gte && {
                                refundRequestDate: dateFilter,
                            }),
                        },
                    }),

                    // 2️⃣ Pending requests (REFUNDED orders without any refund record)
                    this.prisma.order.count({
                        where: {
                            status: 'REFUNDED',
                            refund: null,
                            ...(dateFilter.gte && {
                                refundRequestDate: dateFilter,
                            }),
                        },
                    }),

                    // 3️⃣ Approved / Processing / Success refunds (Refund exists with specific status)
                    this.prisma.order.count({
                        where: {
                            refund: {
                                is: {
                                    status: { in: ['INITIATED', 'PROCESSING', 'SUCCESS'] },
                                    ...(dateFilter.gte && { createdAt: dateFilter }),
                                },
                            },
                        },
                    }),

                    // 4️⃣ Cancelled refunds
                    this.prisma.order.count({
                        where: {
                            refundStatus: 'CANCELLED',
                            ...(dateFilter.gte && { createdAt: dateFilter }),
                        },
                    })
                ]);

            //  Prepare dashboard cards
            const cards = [
                {
                    title: 'Total Requests',
                    value: totalRequests,
                    bottomText: 'All refund requests',
                },
                {
                    title: 'Pending',
                    value: pendingRequests,
                    bottomText: 'Needs attention',
                },
                {
                    title: 'Approved',
                    value: approvedRequests,
                    bottomText: 'Processed',
                },
                {
                    title: 'Declined',
                    value: cancelledRequests,
                    bottomText: 'Rejected',
                },
            ];

            return {
                message: 'Showing all the cards for refund dashboard',
                cards,
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Fetch all the refund transcation details
    async fetchAllRefundRequests(
        page: number,
        search?: string,
        status?: string,
        fromDate?: string,
        toDate?: string
    ) {
        try {
            const limit = 5;
            const skip = (page - 1) * limit;

            const where: any = {
                status: 'REFUNDED', // All refund-related orders
            };

            // 🔍 Search filter
            if (search) {
                where.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { orderId: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ];
            }

            // 📅 Date filter
            let dateFilter: any = {};
            if (fromDate && toDate) {
                const startDate = new Date(fromDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);

                dateFilter = {
                    gte: startDate,
                    lte: endDate,
                };
            }

            // 🧾 Status filter
            if (status) {
                const checkStatus = status as OrderRefundStatus;
                const statusValue = Object.values(OrderRefundStatus).includes(checkStatus)
                    ? checkStatus
                    : null;

                if (!statusValue)
                    throw new BadRequestException('Enter a valid status value');

                // Directly filter using refundStatus field in Order model
                where.refundStatus = statusValue;

                // Apply date filter (if provided)
                if (dateFilter.gte) {
                    where.AND = [
                        { refundStatus: statusValue },
                        { refundRequestDate: dateFilter },
                    ];
                }
            } else if (dateFilter.gte) {
                // Apply only date range without status
                where.refundRequestDate = dateFilter;
            }


            // 🔄 Fetch data
            const [allRefundOrders, totalCount] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        refund: true, // include refund info for clarity
                    },
                }),
                this.prisma.order.count({ where }),
            ]);

            const allRecords = {
                allRefundOrders,
                totalCount,
                currentPage: page,
                perPage: limit,
                totalPage: Math.ceil(totalCount / limit) || 1,
            };

            return { message: 'Showing the refund dashboard data', allRecords };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Refund Function
    async refundOrder(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true, refund: true },
        }) || (() => { throw new BadRequestException('No order found with the id') })()

        if (!order) throw new NotFoundException('Order not found');
        if (!order.payment) throw new BadRequestException('Payment not found for this order');
        if (order.refund) throw new BadRequestException('Refund already processed for this order');
        if (order.payment.status !== "CAPTURED") throw new BadRequestException('Payment not captured, cannot refund');

        const amount = order.totalAmountInPaise;
        if (!amount || amount <= 0) throw new BadRequestException('Invalid refund amount');

        try {
            const refund = await this.razorpay.payments.refund(order.payment.razorpayPaymentId, {
                amount,
                notes: { reason: 'Full refund requested' },
            });

            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    refundStatus: 'APPROVED'
                },
                include: { refund: true }
            })


            await this.prisma.refund.create({
                data: {
                    orderId: order.id,
                    refundId: refund.id,
                    amountInPaise: refund.amount,
                    status: 'PROCESSING',
                    metadata: refund,
                },
            });

            return {
                message: 'Refund accepted successfully!', order: await this.prisma.order.findUnique({ where: { id: orderId }, include: { refund: true } })
            };
        } catch (error) {
            console.error('Razorpay refund error:', error);
            throw new BadRequestException(`Refund failed: ${error.description || error.message}`);
        }
    }

    // Cancel Refund order
    async cancelRefundOrder(orderId: number) {
        try {
            await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { payment: true, refund: true },
            }) || (() => { throw new BadRequestException('No order found with the id') })()

            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    refundStatus: 'CANCELLED'
                },
                include: { refund: true }
            })

            return { message: "Refund request cancelled successfully!", order: updatedOrder }

        } catch (error) {
            catchBlock(error)
        }
    }

    // Export all refund data
    async exportRefundData() {
        try {
            const allOrders = await this.prisma.order.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                include: { refund: true }
            })
            return { message: 'Showing all the refund records for export data', allOrders }
        } catch (error) {
            catchBlock(error)
        }
    }

    //==== End of refund management ====

    // ==== Start of callback module ====
    //Fetch all users
    async fetchAllUsers(page: number, search?: string, fromDate?: string, toDate?: string) {
        try {
            const limit = 5
            const skip = (page - 1) * limit
            const where: any = {}

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } }
                ]
            }

            if (fromDate && toDate) {
                const startDate = new Date(fromDate)
                startDate.setHours(0, 0, 0, 0)
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)

                where.createdAt = {
                    gte: startDate,
                    lte: endDate
                }
            }

            const [allUsers, totalCount] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                this.prisma.user.count({
                    where
                })
            ])

            const allUserDetails = {
                allUsers,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit) || 1,
                perPage: limit

            }

            return { message: 'Showing all the users', allUserDetails }

        } catch (error) {
            catchBlock(error)
        }
    }

    //Fetch all callbacks
    async fetchAllCallbacks(page: number, search?: string, fromDate?: string, toDate?: string) {
        try {
            const limit = 5
            const skip = (page - 1) * limit
            const where: any = {}

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { message: { contains: search, mode: 'insensitive' } }
                ]
            }

            if (fromDate && toDate) {
                const startDate = new Date(fromDate)
                startDate.setHours(0, 0, 0, 0)
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)

                where.createdAt = {
                    gte: startDate,
                    lte: endDate
                }
            }

            const [allCallbacks, totalCount] = await Promise.all([
                this.prisma.contactForm.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                this.prisma.contactForm.count({
                    where
                })
            ])

            const allCallbackDetails = {
                allCallbacks,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit) || 1,
                perPage: limit

            }

            return { message: 'Showing all the users', allCallbackDetails }

        } catch (error) {
            catchBlock(error)
        }
    }

    //Fetch all user data fro export
    async fetchAllUsersForExport() {
        try {
            const allUsers = await this.prisma.user.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
            return { message: 'Showing all the user data', allUsers }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Delete a specific callback
    async deleteCallback(id: number) {
        try {
            await this.prisma.contactForm.findFirst({ where: { id } }) || (() => { throw new BadRequestException('No callback with the id') })()
            await this.prisma.contactForm.delete({ where: { id } })
            return { message: 'Callback deleted successfully' }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Delete a specific user
    async deleteUser(id: number) {
        try {
            await this.prisma.user.findFirst({ where: { id } }) || (() => { throw new BadRequestException('No user with the id') })()
            await this.prisma.user.delete({ where: { id } })
            return { message: 'User deleted successfully' }
        } catch (error) {
            catchBlock(error)
        }
    }

    // ====End of callback module ====

    // ==== Start of notification module ====

    async toggleSetting(field: string) {
        try {
            const validFields = [
                'newBookings',
                'paymentConfirmations',
                'dailySummary',
                'weeklySummary',
                'monthlySummary',
            ];

            if (!validFields.includes(field)) {
                throw new BadRequestException('Invalid field name');
            }

            // Fetch current settings (assuming single global record)
            const settings = await this.prisma.settings.findFirst();
            if (!settings) throw new BadRequestException('Settings record not found');

            const currentValue = settings[field];
            const updated = await this.prisma.settings.update({
                where: { id: settings.id },
                data: { [field]: !currentValue },
            });

            return { message: `Setting ${field} updated successfully`, updated };

        } catch (error) {
            catchBlock(error)
        }
    }


}
