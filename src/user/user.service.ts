import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
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
                    name,
                    email: dto.email,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                    name: true
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



}
