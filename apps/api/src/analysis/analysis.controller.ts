// src/analysis/analysis.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import {
  GlobalAnalysis,
  PatientAnalysis,
  SessionAnalysis,
} from './analysis.types';

@Controller('analysis') // con globalPrefix('api/v1') → /api/v1/analysis/...
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('global')
  async getGlobalAnalysis(): Promise<GlobalAnalysis> {
    return this.analysisService.getGlobalAnalysis();
  }

  @Get('patient/:id')
  async getPatientAnalysis(@Param('id') id: string): Promise<PatientAnalysis> {
    return this.analysisService.getPatientAnalysis(id);
  }

  @Get('session/:id')
  async getSessionAnalysis(@Param('id') id: string): Promise<SessionAnalysis> {
    return this.analysisService.getSessionAnalysis(id);
  }
}
