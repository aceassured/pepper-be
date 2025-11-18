import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private config: ConfigService,
        private userService: UserService,
    ) {
        super({
            clientID: config.get('GOOGLE_CLIENT_ID'),
            clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: config.get('GOOGLE_CALLBACK_URL'),
            scope: ['profile', 'email'],
        });
    }

    // passport calls this after successful auth with Google
    async validate(accessToken: string, refreshToken: string, profile: Profile, done: Function) {
        const email = profile?.emails?.[0]?.value;
        const name = profile?.displayName;
        const providerId = profile.id;

        try {
            const user = await this.userService.validateOAuthLogin({
                provider: 'google',
                providerId,
                email,
                name
            });

            // pass user to request (req.user)
            done(null, user);
        } catch (err) {
            done(err, false);
        }
    }
}
