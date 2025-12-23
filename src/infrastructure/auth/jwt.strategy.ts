import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
    sub: number;
    correo: string;
    nombre: string;
    roles: any[];
    permisos: any[];
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException('Token inválido');
        }

        // Return user object that will be attached to request.user
        return {
            id: payload.sub,
            sub: payload.sub,
            correo: payload.correo,
            nombre: payload.nombre,
            roles: payload.roles,
            permisos: payload.permisos,
        };
    }
}
