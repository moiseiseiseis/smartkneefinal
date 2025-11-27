// src/analysis/analysis.module.ts

import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, PrismaService],
})
export class AnalysisModule {}
