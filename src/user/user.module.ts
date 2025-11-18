import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { JwtModule } from "@nestjs/jwt";
import { GoogleStrategy } from "./strategy/google.strategy";



@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {}
        })],
    controllers: [UserController],
    providers: [UserService,GoogleStrategy],
    exports: [UserService, JwtModule]
})

export class UserModule { }