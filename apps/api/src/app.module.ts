import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { SessionsModule } from './sessions/sessions.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PatientsModule, SessionsModule, AnalysisModule],
  providers: [PrismaService],
})
export class AppModule {}
