import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../common/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: Number(cfg.get('JWT_EXPIRES') ?? 604800) }, // segundos
      }),
    }),
  ],
  controllers: [AuthController],     // <- asegúrate de esto
  providers: [AuthService, PrismaService, JwtStrategy],
})
export class AuthModule {}
