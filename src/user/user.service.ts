import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user-dto';
import { catchBlock } from '../common/CatchBlock';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { sendOtpToUser } from '../common/send-otp';
import { ContactDto } from './dto/contact.dto';
import { sendContactMail } from '../common/sendContactMail';
import * as pincodes from 'indian-pincodes'
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';



@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }

    // 🔹 Register user
    async register(dto: CreateUserDto) {
        try {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (existing) throw new BadRequestException('Email already registered');

            const hashedPassword = await bcrypt.hash(dto.password, 10);

            const name = dto?.email?.split('@')[0]

            const user = await this.prisma.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    password: hashedPassword,
                    phone: dto.phone,
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                    name: true,
                    phone: true
                },
            });

            return { message: 'New user registered successfully', user }
        } catch (error) {
            catchBlock(error)
        }
    }

    // 🔹 Login user
    async login(dto: CreateUserDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new UnauthorizedException('Invalid credentials');

            const isPasswordValid = await bcrypt.compare(dto.password, user.password);
            if (!isPasswordValid)
                throw new UnauthorizedException('Invalid credentials');

            const payload = { id: user.id, email: user.email };
            const token = await this.jwt.signAsync(payload);

            const loginDetails = {
                ...user,
                isAdmin: false,
                token
            }

            return { message: 'Login successfull', user: loginDetails }
        } catch (error) {
            catchBlock(error)
        }
    }


    // 🔹 Send OTP
    async sendOtp(dto: SendOtpDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');

            const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

            // Update user with OTP
            await this.prisma.user.update({
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
            const user = await this.prisma.user.findUnique({
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
            await this.prisma.user.update({
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
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user) throw new BadRequestException('User not found');

            const previousHashedPassword = await bcrypt.compare(dto.password, user.password)

            if (previousHashedPassword) {
                throw new BadRequestException('New password must be different from old password')
            }

            const hashedPassword = await bcrypt.hash(dto.password, 10);

            await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    password: hashedPassword,
                    otp: null,
                    expiresAt: null,
                },
            });

            return { message: 'Password reset successfully' };
        } catch (error) {
            catchBlock(error);
        }
    }

    // 🔹 Contact Form Handler
    async contact(dto: ContactDto) {
        try {
            // Save to database
            const contact = await this.prisma.contactForm.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    phone: dto.phone,
                    message: dto.message,
                },
            });

            // Send emails
            await sendContactMail(dto);

            return { message: 'Contact details submitted successfully', contact };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Make a new callback
    async makeCallBack(id: number) {
        try {
            await this.prisma.user.findUnique({ where: { id } }) || (() => { throw new BadRequestException('No user found with the id') })()

            const newCallBack = await this.prisma.callBack.create({
                data: {
                    user: {
                        connect: {
                            id: id
                        }
                    }
                },
                include: { user: true }
            })

            return { message: "New callback saved successfully!", callBack: newCallBack }

        } catch (error) {
            catchBlock(error)
        }
    }

    /**
  * Get all PIN codes for a given state and district
  * @param state - e.g., 'Tamil Nadu'
  * @param district - e.g., 'Coimbatore'
  * @returns array of pincodes as strings
  */
    getPincodesByStateAndDistrict(state: string, district: string) {
        try {
            if (!state || !district) {
                throw new Error('Both state and district are required');
            }

            const stateName = state.trim();
            const districtName = district.trim();

            let result: any[] = [];

            // Try district-level method first (if available)
            if (typeof (pincodes as any).getPincodesByDistrict === 'function') {
                try {
                    result = (pincodes as any).getPincodesByDistrict(districtName, stateName);
                } catch (err) {
                    console.error('Error fetching by district:', err);
                }
            }



            // Fallback: get all by state, then filter by district
            if ((!result || result.length === 0) && typeof (pincodes as any).getPincodesByState === 'function') {
                try {
                    const allStatePincodes = (pincodes as any).getPincodesByState(stateName);
                    result = allStatePincodes.filter((entry: any) => {
                        const entryDistrict =
                            (entry.district || entry.District || '').trim().toLowerCase();
                        return entryDistrict === districtName.toLowerCase();
                    });
                } catch (err) {
                    catchBlock(err)
                }
            }
            return { message: 'Showing all the pincodes', result }
        } catch (error) {
            catchBlock(error)
        }
    }

    // Dashboard Service Methods

    async getDashboardDetails() {
        try {
            const today = new Date();
            const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

            // ============= TOTAL VISITORS =============
            // Current month visitors
            const currentMonthVisitors = await this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfCurrentMonth,
                        lt: today
                    }
                }
            });

            // Last month visitors
            const lastMonthVisitors = await this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            });

            const visitorsPercentageChange = lastMonthVisitors > 0
                ? Math.round(((currentMonthVisitors - lastMonthVisitors) / lastMonthVisitors) * 100)
                : 0;

            const visitorsChangeDirection = visitorsPercentageChange >= 0 ? '+' : '';

            // ============= TOTAL ORDERS =============
            // Current month orders
            const currentMonthOrders = await this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: startOfCurrentMonth,
                        lt: today
                    }
                }
            });

            // Last month orders
            const lastMonthOrders = await this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            });

            const ordersPercentageChange = lastMonthOrders > 0
                ? Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
                : 0;

            const ordersChangeDirection = ordersPercentageChange >= 0 ? '+' : '';

            // ============= TOTAL REVENUE =============
            // Current month revenue (in paise)
            const currentMonthRevenueData = await this.prisma.payment.aggregate({
                _sum: {
                    amountInPaise: true
                },
                where: {
                    status: "CAPTURED",
                    createdAt: {
                        gte: startOfCurrentMonth,
                        lt: today
                    }
                }
            });

            const currentMonthRevenueInPaise = currentMonthRevenueData._sum.amountInPaise || 0;
            const currentMonthRevenue = currentMonthRevenueInPaise / 100;

            // Last month revenue
            const lastMonthRevenueData = await this.prisma.payment.aggregate({
                _sum: {
                    amountInPaise: true
                },
                where: {
                    status: "CAPTURED",
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            });

            const lastMonthRevenueInPaise = lastMonthRevenueData._sum.amountInPaise || 0;
            const lastMonthRevenue = lastMonthRevenueInPaise / 100;

            const revenuePercentageChange = lastMonthRevenue > 0
                ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
                : 0;

            const revenueChangeDirection = revenuePercentageChange >= 0 ? '+' : '';

            // ============= PENDING PAYMENTS =============
            // Current pending payments
            const currentPendingPaymentsData = await this.prisma.order.aggregate({
                _sum: {
                    totalAmountInPaise: true
                },
                where: {
                    status: "PENDING",
                    createdAt: {
                        gte: startOfCurrentMonth,
                        lt: today
                    }
                }
            });

            const currentPendingInPaise = currentPendingPaymentsData._sum.totalAmountInPaise || 0;
            const currentPendingPayments = currentPendingInPaise / 100;

            // Last month pending payments
            const lastPendingPaymentsData = await this.prisma.order.aggregate({
                _sum: {
                    totalAmountInPaise: true
                },
                where: {
                    status: "PENDING",
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            });

            const lastPendingInPaise = lastPendingPaymentsData._sum.totalAmountInPaise || 0;
            const lastPendingPayments = lastPendingInPaise / 100;

            const pendingPercentageChange = lastPendingPayments > 0
                ? Math.round(((currentPendingPayments - lastPendingPayments) / lastPendingPayments) * 100)
                : 0;

            const pendingChangeDirection = pendingPercentageChange >= 0 ? '+' : '';

            return {
                totalVisitors: {
                    count: currentMonthVisitors,
                    change: `${visitorsChangeDirection}${Math.abs(visitorsPercentageChange)}%`,
                    changeValue: visitorsPercentageChange,
                    label: "Total Visitors",
                    period: "from last month"
                },
                totalOrders: {
                    count: currentMonthOrders,
                    change: `${ordersChangeDirection}${Math.abs(ordersPercentageChange)}%`,
                    changeValue: ordersPercentageChange,
                    label: "Total Orders",
                    period: "from last month"
                },
                totalRevenue: {
                    count: Math.round(currentMonthRevenue),
                    change: `${revenueChangeDirection}${Math.abs(revenuePercentageChange)}%`,
                    changeValue: revenuePercentageChange,
                    label: "Total Revenue",
                    formatted: `₹${Math.round(currentMonthRevenue).toLocaleString('en-IN')}`,
                    period: "from last month"
                },
                pendingPayments: {
                    count: Math.round(currentPendingPayments),
                    change: `${pendingChangeDirection}${Math.abs(pendingPercentageChange)}%`,
                    changeValue: pendingPercentageChange,
                    label: "Pending Payments",
                    formatted: `₹${Math.round(currentPendingPayments).toLocaleString('en-IN')}`,
                    period: "from last month"
                }
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    async getDashboardDetailsforChart(period: 'last6months' | 'last12months' = 'last6months') {
        try {
            const today = new Date();
            const months = period === 'last6months' ? 6 : 12;

            // Generate array of months
            interface MonthData {
                date: Date;
                month: string;
                startDate: Date;
                endDate: Date;
                fullMonth: any
            }

            const monthsArray: MonthData[] = [];

            for (let i = months - 1; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                monthsArray.push({
                    date: date,
                    month: date.toLocaleDateString('en-IN', { month: 'short' }),
                    fullMonth: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                    startDate: new Date(date.getFullYear(), date.getMonth(), 1),
                    endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
                });
            }

            // Fetch visitor data for each month
            const monthlyVisitorsData = await Promise.all(
                monthsArray.map(async (monthData) => {
                    const visitorsCount = await this.prisma.user.count({
                        where: {
                            createdAt: {
                                gte: monthData.startDate,
                                lte: monthData.endDate
                            }
                        }
                    });

                    return {
                        month: monthData.month,
                        visitors: visitorsCount,
                        fullMonth: monthData.fullMonth
                    };
                })
            );

            // Calculate total visitors for the period
            const totalVisitors = monthlyVisitorsData.reduce((sum, d) => sum + d.visitors, 0);

            return {
                period: period,
                monthlyVisitors: monthlyVisitorsData,
                total: totalVisitors,
                chartData: monthlyVisitorsData.map(d => ({
                    name: d.month,
                    value: d.visitors
                }))
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    async getDashboardDetailsforGraph(period: 'last6months' | 'last12months' = 'last6months') {
        try {
            const today = new Date();
            const months = period === 'last6months' ? 6 : 12;

            // Generate array of months

            interface MonthData {
                date: Date;
                month: string;
                startDate: Date;
                endDate: Date;
                fullMonth: any
            }

            const monthsArray: MonthData[] = [];


            // const monthsArray = [];
            for (let i = months - 1; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                monthsArray.push({
                    date: date,
                    month: date.toLocaleDateString('en-IN', { month: 'short' }),
                    fullMonth: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                    startDate: new Date(date.getFullYear(), date.getMonth(), 1),
                    endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
                });
            }

            // Fetch revenue data for each month
            const revenueTrendData = await Promise.all(
                monthsArray.map(async (monthData) => {
                    const revenueData = await this.prisma.payment.aggregate({
                        _sum: {
                            amountInPaise: true
                        },
                        where: {
                            status: "CAPTURED",
                            createdAt: {
                                gte: monthData.startDate,
                                lte: monthData.endDate
                            }
                        }
                    });

                    const revenueInRupees = (revenueData._sum.amountInPaise || 0) / 100;

                    return {
                        month: monthData.month,
                        revenue: Math.round(revenueInRupees),
                        fullMonth: monthData.fullMonth,
                        formatted: `₹${Math.round(revenueInRupees).toLocaleString('en-IN')}`
                    };
                })
            );

            // Calculate total revenue and peak month
            const totalRevenue = revenueTrendData.reduce((sum, d) => sum + d.revenue, 0);
            const peakRevenueData = revenueTrendData.reduce((max, d) =>
                d.revenue > max.revenue ? d : max, revenueTrendData[0]
            );

            // Determine trend direction (last month vs previous month)
            const isUpwardTrend = revenueTrendData[revenueTrendData.length - 1].revenue >=
                (revenueTrendData[revenueTrendData.length - 2]?.revenue || 0);

            const trendDescription = isUpwardTrend
                ? `Showing upward trend with ${peakRevenueData.formatted} peak revenue`
                : `Showing downward trend with ${peakRevenueData.formatted} peak revenue`;

            return {
                period: period,
                revenueTrend: revenueTrendData,
                summary: {
                    totalRevenue: totalRevenue,
                    totalRevenueFormatted: `₹${totalRevenue.toLocaleString('en-IN')}`,
                    peakRevenue: peakRevenueData.revenue,
                    peakRevenueFormatted: peakRevenueData.formatted,
                    peakRevenueMonth: peakRevenueData.month,
                    peakRevenueFullMonth: peakRevenueData.fullMonth,
                    trend: isUpwardTrend ? 'upward' : 'downward',
                    trendDescription: trendDescription
                },
                chartData: revenueTrendData.map(d => ({
                    month: d.month,
                    revenue: d.revenue
                }))
            };
        } catch (error) {
            catchBlock(error);
        }
    }

    // Testimonials module

    async createTestimonial(dto: CreateTestimonialDto) {
        try {
            const result = await this.prisma.testimonials.create({
                data: {
                    name: dto.name,
                    place: dto.place,
                    rating: dto.rating,
                    message: dto.message,
                    active: dto.active ?? true,
                },
            });
            return { message: 'New testmonial added successfully!', result }
        } catch (error) {
            catchBlock(error)
        }
    }

    async findAllTestimonials() {
        try {
            return this.prisma.testimonials.findMany({
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            catchBlock(error)
        }
    }

    async findOneTestimonial(id: number) {
        try {
            const testimonial = await this.prisma.testimonials.findUnique({
                where: { id },
            });
            if (!testimonial) throw new NotFoundException('Testimonial not found');
            return testimonial;
        } catch (error) {
            catchBlock(error)
        }
    }

    async updateTestimonial(id: number, dto: CreateTestimonialDto) {
        try {
            const existing = await this.prisma.testimonials.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Testimonial not found');

            return this.prisma.testimonials.update({
                where: { id },
                data: { ...dto },
            });
        } catch (error) {
            catchBlock(error)
        }
    }

    async removeTestimonial(id: number) {
        try {
            await this.prisma.testimonials.findUnique({ where: { id } }) || (()=>{throw new BadRequestException("Testimonial not found")})()
            await this.prisma.testimonials.delete({ where: { id } });
            return { success: true , message:'Testimonial removed successfully!' };
        } catch (error) {
            catchBlock(error)
        }
    }


}
